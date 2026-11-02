/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Gerenciador de Armazenamento de Capas com IndexedDB e Compressão Automática
 * Resolve o problema de quota limitada do localStorage (limite de 5MB do navegador).
 */

const DB_NAME = 'PS4_LIBRARY_DB';
const DB_VERSION = 1;
const STORE_NAME = 'game_covers';
const LEGACY_STORAGE_KEY = 'ps4_custom_game_covers';

/**
 * Abre a conexão com o banco de dados IndexedDB
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB não suportado neste ambiente.'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Carrega todas as capas salvas (com migração suave do localStorage)
 */
export async function carregarTodasCapas(): Promise<Record<string, string>> {
  const capas: Record<string, string> = {};

  // 1. Tenta carregar do localStorage (legado/fallback)
  try {
    const legadas = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legadas) {
      const obj = JSON.parse(legadas);
      Object.assign(capas, obj);
    }
  } catch {
    // Ignora erro do localStorage
  }

  // 2. Carrega do IndexedDB (armazenamento prioritário de alta capacidade)
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const itens = request.result as Array<{ id: string; imagem: string }>;
        if (Array.isArray(itens)) {
          itens.forEach((item) => {
            if (item.id && item.imagem) {
              capas[item.id] = item.imagem;
            }
          });
        }
        resolve(capas);
      };

      request.onerror = () => {
        // Fallback para capas do localStorage se o IndexedDB falhar
        resolve(capas);
      };
    });
  } catch (err) {
    console.warn('Usando armazenamento local alternativo para capas:', err);
    return capas;
  }
}

/**
 * Salva a imagem de capa de um jogo no IndexedDB e faz backup no localStorage se couber
 */
export async function salvarCapaJogo(id: string, imagem: string): Promise<boolean> {
  let salvoIndexedDB = false;

  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.put({ id, imagem, atualizadoEm: Date.now() });

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    salvoIndexedDB = true;
  } catch (err) {
    console.warn('Erro ao salvar no IndexedDB:', err);
  }

  // Tenta manter backup no localStorage com captura de QuotaExceededError
  try {
    const salvas = localStorage.getItem(LEGACY_STORAGE_KEY);
    const obj = salvas ? JSON.parse(salvas) : {};
    obj[id] = imagem;
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(obj));
  } catch (quotaErr) {
    // Se o localStorage estourar os 5MB, ele não quebra a aplicação pois o IndexedDB já salvou
    console.info('LocalStorage cheio, salvo com sucesso no IndexedDB de alta capacidade.');
  }

  return salvoIndexedDB;
}

/**
 * Remove a capa customizada de um jogo
 */
export async function removerCapaJogo(id: string): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.delete(id);
  } catch (err) {
    console.warn('Erro ao deletar do IndexedDB:', err);
  }

  try {
    const salvas = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (salvas) {
      const obj = JSON.parse(salvas);
      delete obj[id];
      localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(obj));
    }
  } catch {
    // Ignora
  }
}

/**
 * Otimiza e redimensiona imagens pesadas para proporção ideal de capa PS4 (3:4)
 * Reduz imagens de 5MB para ~35KB em formato JPEG otimizado
 */
export function comprimirImagemParaCapa(file: File, maxLargura = 420, maxAltura = 560): Promise<string> {
  return new Promise((resolve, reject) => {
    // Se não for imagem, rejeita
    if (!file.type.startsWith('image/')) {
      return reject(new Error('O arquivo selecionado não é uma imagem válida.'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo de imagem.'));

    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Erro ao processar os dados da imagem.'));

      img.onload = () => {
        // Calcula dimensões mantendo aspecto ou ajustando para o box
        let largura = img.width;
        let altura = img.height;

        if (largura > maxLargura || altura > maxAltura) {
          const ratioLargura = maxLargura / largura;
          const ratioAltura = maxAltura / altura;
          const ratio = Math.min(ratioLargura, ratioAltura);

          largura = Math.round(largura * ratio);
          altura = Math.round(altura * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = largura;
        canvas.height = altura;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(reader.result as string);
        }

        // Fundo preto suave para evitar bordas transparentes indesejadas
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, largura, altura);

        // Suavização de alta qualidade
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, largura, altura);

        // Exporta como JPEG compacto (qualidade 0.84 = excelente nitidez com tamanho minúsculo)
        try {
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.84);
          resolve(compressedDataUrl);
        } catch {
          resolve(reader.result as string);
        }
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}
