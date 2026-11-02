/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * HD Externo 1TB para PS4 - Pronto para Plugar (com case USB) - DESBLOQUEADO
 * Catálogo interativo de jogos de PS4 com gerenciador de capacidade de armazenamento.
 * 
 * ============================================================================
 * COMO ADICIONAR / EDITAR IMAGENS DOS JOGOS NO CÓDIGO:
 * ============================================================================
 * Cada jogo no array JOGOS aceita o campo opcional `imagem`:
 * 
 * Exemplo:
 * {
 *   id: 'gow-2018',
 *   nome: 'God of War',
 *   genero: 'Ação',
 *   tamanho: 45,
 *   imagem: 'https://images.unsplash.com/... ou sua URL de imagem aqui',
 *   ...
 * }
 * 
 * Você também pode alterar a capa DIRETAMENTE PELA INTERFACE clicando no botão
 * "Alterar Capa" (ícone de imagem/lápis) em cada card de jogo, colando um link
 * ou fazendo upload de um arquivo do seu computador!
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  HardDrive, 
  Search, 
  Trash2, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Zap, 
  Gamepad2, 
  X, 
  Sparkles, 
  Info,
  Check,
  Send,
  Camera,
  Image as ImageIcon,
  Upload,
  RotateCcw,
  SlidersHorizontal
} from 'lucide-react';
import * as XLSX from 'xlsx';
import heroImage from './assets/images/ps4_hd_externo_setup_1793534885878.jpg';
import permanentGameCovers from './data/gameCovers.json';
import { comprimirImagemParaCapa } from './utils/imageStorage';

/**
 * Detecta se a aplicação está rodando no ambiente de desenvolvimento.
 * No site publicado (produção / clientes), toda a edição de capas fica desativada e oculta.
 */
export const isDevEnvironment = (): boolean => {
  if (typeof window === 'undefined') return false;
  return Boolean(
    import.meta.env.DEV ||
    window.location.hostname.includes('ais-dev') ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );
};

// ============================================================================
// CONFIGURAÇÕES DE CAPACIDADE DO HD
// ============================================================================
export const HD_TOTAL_GB = 1000;         // 1TB utilizável
export const HD_SISTEMA_GB = 85;         // Firmware / Sistema do PS4 (fixo e reservado)
export const HD_DISPONIVEL_JOGOS_GB = 915; // Capacidade máxima líquida para jogos

// ============================================================================
// BIBLIOTECA DE JOGOS PS4 (Mais de 100 jogos reais de PS4)
// Cada jogo contém: id, nome, genero, tamanho (em GB), ano, destaque (opcional),
// corTema, descricao e imagem (opcional).
// ============================================================================
export interface Jogo {
  id: string;
  nome: string;
  genero: string;
  tamanho: number; // Em GB
  ano?: number;
  destaque?: boolean;
  corTema?: string;
  descricao?: string;
  imagem?: string; // URL da imagem/capa do jogo
}

export const JOGOS: Jogo[] = [
  // --- JOGOS DA PLANILHA OFICIAL (103 TÍTULOS DE PS4) ---
  { id: 'a-plague-tale', nome: 'A Plague Tale: Innocence', genero: 'Ação', tamanho: 40, ano: 2019, destaque: true, corTema: '#7f1d1d', descricao: 'Ambientado em uma França medieval sombria e marcada por pragas, um mundo repleto de perigo e escuridão.' },
  { id: 'a-way-out', nome: 'A Way Out', genero: 'Ação', tamanho: 18, ano: 2018, destaque: true, corTema: '#0891b2', descricao: 'Uma experiência cooperativa única onde dois jogadores precisam trabalhar juntos para escapar da prisão.' },
  { id: 'abzu', nome: 'ABZÛ', genero: 'Aventura', tamanho: 3, ano: 2016, destaque: false, corTema: '#0284c7', descricao: 'Inspirado pela beleza do oceano, ABZÛ convida os jogadores a mergulhar em um vibrante mundo marinho.' },
  { id: 'achilles-legends-untold', nome: 'Achilles: Legends Untold', genero: 'Ação', tamanho: 9, ano: 2023, destaque: false, corTema: '#831843', descricao: 'Controle o lendário herói Aquiles em combates táticos contra criaturas e guerreiros míticos.' },
  { id: 'alan-wake-remastered', nome: 'Alan Wake Remastered', genero: 'Ação', tamanho: 30, ano: 2021, destaque: false, corTema: '#991b1b', descricao: 'O clássico suspense psicológico remasterizado em alta definição para PS4.' },
  { id: 'ac-valhalla', nome: "Assassin's Creed Valhalla", genero: 'RPG', tamanho: 60, ano: 2020, destaque: true, corTema: '#134e4a', descricao: 'Lidere invasões vikings na Inglaterra medieval como o guerreiro Eivor.' },
  { id: 'batman-arkham-knight', nome: 'Batman: Arkham Knight Premium Edition', genero: 'Ação', tamanho: 50, ano: 2015, destaque: true, corTema: '#1e293b', descricao: 'O Cavaleiro das Trevas defende Gotham com o Batmóvel nesta edição com passe de temporada completo.' },
  { id: 'batman-return-to-arkham', nome: 'Batman: Return to Arkham', genero: 'Ação', tamanho: 29, ano: 2016, destaque: false, corTema: '#4b5563', descricao: 'A coleção contendo Batman: Arkham Asylum e Batman: Arkham City remasterizados.' },
  { id: 'bioshock-infinite', nome: 'BioShock Infinite: The Complete Edition', genero: 'Tiro', tamanho: 36, ano: 2016, destaque: false, corTema: '#0284c7', descricao: 'Edição aprimorada do aclamado BioShock Infinite na cidade aérea de Columbia.' },
  { id: 'bleach-rebirth-of-souls', nome: 'BLEACH: Rebirth of Souls', genero: 'Luta', tamanho: 27, ano: 2025, destaque: false, corTema: '#0369a1', descricao: 'Ação empolgante com espadas com uma grande variedade de personagens do universo BLEACH.' },
  { id: 'bloodborne', nome: 'Bloodborne', genero: 'RPG', tamanho: 30, ano: 2015, destaque: true, corTema: '#3f3f46', descricao: 'A sombria e lendária caçada gótica pelas ruas amaldiçoadas de Yharnam.' },
  { id: 'bully', nome: 'Bully', genero: 'Aventura', tamanho: 3, ano: 2016, destaque: false, corTema: '#1e3a8a', descricao: 'Jimmy Hopkins enfrenta valentões, professores e gangues no clássico internato de Bullworth.' },
  { id: 'dark-souls-2', nome: 'Dark Souls II: Scholar of the First Sin', genero: 'RPG', tamanho: 15, ano: 2015, destaque: false, corTema: '#78350f', descricao: 'A jornada definitiva por Drangleic com gameplay a 60 FPS e todas as DLCs.' },
  { id: 'dark-souls-3', nome: 'Dark Souls III', genero: 'RPG', tamanho: 25, ano: 2016, destaque: true, corTema: '#52525b', descricao: 'Viaje por Lothric combatendo os Lordes das Cinzas no grandioso desfecho da trilogia.' },
  { id: 'dark-souls-remastered', nome: 'Dark Souls Remastered', genero: 'RPG', tamanho: 15, ano: 2018, destaque: false, corTema: '#404040', descricao: 'O clássico que iniciou a lenda em Lordran, rodando em 1080p a 60 quadros por segundo.' },
  { id: 'days-gone', nome: 'Days Gone', genero: 'Ação', tamanho: 60, ano: 2019, destaque: true, corTema: '#374151', descricao: 'Sobreviva sobre duas rodas em um mundo pós-apocalíptico enfrentando hordas colossais.' },
  { id: 'death-stranding', nome: 'Death Stranding', genero: 'Ação', tamanho: 50, ano: 2019, destaque: true, corTema: '#1e293b', descricao: 'Reconecte cidades isoladas em uma jornada revolucionária dirigida por Hideo Kojima.' },
  { id: 'demon-slayer', nome: 'Demon Slayer: The Hinokami Chronicles', genero: 'Luta', tamanho: 20, ano: 2021, destaque: false, corTema: '#991b1b', descricao: 'Jogue com Tanjiro, Nezuko e seus amigos nas batalhas mais marcantes do anime.' },
  { id: 'devil-may-cry-5', nome: 'Devil May Cry 5', genero: 'Ação', tamanho: 35, ano: 2019, destaque: true, corTema: '#1e3a8a', descricao: 'Combates estilosos com combos alucinantes de Dante, Nero e V em Red Grave City.' },
  { id: 'dbz-kakarot', nome: 'Dragon Ball Z: Kakarot', genero: 'RPG', tamanho: 35, ano: 2020, destaque: true, corTema: '#155e75', descricao: 'Acompanhe Goku e os guerreiros Z por toda a saga famosa em um grande RPG de ação.' },
  { id: 'dying-light-2', nome: 'Dying Light 2 Stay Human', genero: 'Terror', tamanho: 22, ano: 2022, destaque: true, corTema: '#b45309', descricao: 'Em um mundo pós-apocalíptico, use habilidades de parkour e combate para sobreviver aos infectados.' },
  { id: 'ea-sports-fc-26', nome: 'EA SPORTS FC 26', genero: 'Esporte', tamanho: 75, ano: 2025, destaque: true, corTema: '#475569', descricao: 'Jogue o mais novo e completo jogo de futebol da atualidade com elencos atualizados.' },
  { id: 'elden-ring', nome: 'Elden Ring', genero: 'RPG', tamanho: 60, ano: 2022, destaque: true, corTema: '#854d0e', descricao: 'O aclamado vencedor de Jogo do Ano pelo vasto mundo aberto das Terras Intermédias.' },
  { id: 'elden-ring-nightreign', nome: 'Elden Ring: Nightreign', genero: 'RPG', tamanho: 30, ano: 2024, destaque: false, corTema: '#64748b', descricao: 'Nova lore, desafios aprimorados e chefes únicos nesta aclamada expansão de fantasia sombria.' },
  { id: 'fallout-4', nome: 'Fallout 4', genero: 'RPG', tamanho: 40, ano: 2015, destaque: false, corTema: '#15803d', descricao: 'Explore e reconstrua as terras devastadas nucleares de Boston com liberdade total.' },
  { id: 'far-cry-6', nome: 'Far Cry 6', genero: 'Tiro', tamanho: 50, ano: 2021, destaque: false, corTema: '#c2410c', descricao: 'Revolução de guerrilha moderna contra a tirania de Antón Castillo na ilha tropical de Yara.' },
  { id: 'final-fantasy-7-remake', nome: 'Final Fantasy VII Remake', genero: 'RPG', tamanho: 85, ano: 2020, destaque: true, corTema: '#047857', descricao: 'Cloud Strife e a resistência de Midgar contra a corporação Shinra nesta recriação épica.' },
  { id: 'ghost-of-tsushima', nome: 'Ghost of Tsushima', genero: 'Ação', tamanho: 50, ano: 2020, destaque: true, corTema: '#831843', descricao: 'O caminho do samurai e o despertar do Fantasma para libertar a ilha de Tsushima.' },
  { id: 'ghost-recon', nome: 'Ghost Recon Breakpoint', genero: 'Tiro', tamanho: 25, ano: 2019, destaque: false, corTema: '#701a75', descricao: 'Tiro tático de mundo aberto em uma ilha tecnológica dominada por forças hostis.' },
  { id: 'god-of-war-2018', nome: 'God of War', genero: 'Ação', tamanho: 45, ano: 2018, destaque: true, corTema: '#7f1d1d', descricao: 'A emocionante e grandiosa jornada de Kratos e Atreus na mitologia nórdica.' },
  { id: 'god-of-war-3-remastered', nome: 'God of War 3 Remastered', genero: 'Ação', tamanho: 40, ano: 2015, destaque: true, corTema: '#334155', descricao: 'O consagrado clímax da vingança de Kratos contra o Olimpo agora remasterizado para PS4.' },
  { id: 'god-of-war-ragnarok', nome: 'God of War Ragnarök', genero: 'Ação', tamanho: 110, ano: 2022, destaque: true, corTema: '#2563eb', descricao: 'Kratos, Atreus e Mimir enfrentam as provações do Fimbulwinter rumo ao destino de Asgard.' },
  { id: 'gran-turismo-7', nome: 'Gran Turismo 7', genero: 'Corrida', tamanho: 100, ano: 2022, destaque: true, corTema: '#0284c7', descricao: 'O simulador automobilístico definitivo com física apurada e mais de 400 veículos.' },
  { id: 'gta-trilogy', nome: 'Grand Theft Auto: The Trilogy', genero: 'Aventura', tamanho: 35, ano: 2021, destaque: true, corTema: '#dc2626', descricao: 'Os três clássicos GTA III, Vice City e San Andreas em um único pacote imperdível.' },
  { id: 'gta-v', nome: 'Grand Theft Auto V', genero: 'Ação', tamanho: 95, ano: 2014, destaque: true, corTema: '#166534', descricao: 'Três criminosos interligados no caos ensolarado de Los Santos e Blaine County.' },
  { id: 'green-hell', nome: 'Green Hell', genero: 'Terror', tamanho: 4, ano: 2021, destaque: false, corTema: '#7f1d1d', descricao: 'Mergulhe no ambiente hostil e claustrofóbico da selva amazônica lutando para sobreviver.' },
  { id: 'hitman-goty', nome: 'Hitman Game of The Year Edition', genero: 'Ação', tamanho: 45, ano: 2017, destaque: false, corTema: '#18181b', descricao: 'O Agente 47 conclui contratos perfeitos pelo mundo nesta edição completa definitiva.' },
  { id: 'hogwarts-legacy', nome: "Hogwarts Legacy", genero: 'RPG', tamanho: 36, ano: 2023, destaque: true, corTema: '#1c1917', descricao: 'Viva em Hogwarts no século XIX detendo a chave para um segredo ancestral do mundo bruxo.' },
  { id: 'hollow-knight-silksong', nome: 'Hollow Knight: Silksong', genero: 'Aventura', tamanho: 3, ano: 2024, destaque: true, corTema: '#ea580c', descricao: 'Hornet em sua jornada épica por um vasto reino repleto de novos desafios e mistérios.' },
  { id: 'hollow-knight-voidheart', nome: 'Hollow Knight: Voidheart Edition', genero: 'Aventura', tamanho: 10, ano: 2018, destaque: true, corTema: '#334155', descricao: 'A obra-prima dos metroidvanias pelo reino subterrâneo de Hallownest com 4 pacotes de conteúdo.' },
  { id: 'horizon-zero-dawn', nome: 'Horizon Zero Dawn', genero: 'RPG', tamanho: 48, ano: 2017, destaque: true, corTema: '#0e7490', descricao: 'Guie a caçadora Aloy por uma terra majestosa dominada por máquinas colossais.' },
  { id: 'inazuma-eleven-victory-road', nome: 'Inazuma Eleven: Victory Road Deluxe Edition', genero: 'Esporte', tamanho: 38, ano: 2024, destaque: false, corTema: '#713f12', descricao: 'Futebol épico com superpoderes e técnicas especiais no novo capítulo da lendária franquia.' },
  { id: 'infamous-second-son', nome: 'inFAMOUS Second Son', genero: 'Ação', tamanho: 24, ano: 2014, destaque: false, corTema: '#593549', descricao: 'Controle os superpoderes de Delsin Rowe em uma vibrante Seattle tomada pela DUP.' },
  { id: 'injustice-2', nome: 'Injustice 2', genero: 'Luta', tamanho: 50, ano: 2017, destaque: false, corTema: '#1d4ed8', descricao: 'Batman contra Superman e o confronto épico entre super-heróis e supervilões da DC.' },
  { id: 'injustice-gods-among-us', nome: 'Injustice: Gods Among Us', genero: 'Luta', tamanho: 22, ano: 2013, destaque: false, corTema: '#04633a', descricao: 'Onde heróis se tornam ameaças globais após o Superman perder o controle.' },
  { id: 'it-takes-two', nome: 'It Takes Two', genero: 'Aventura', tamanho: 40, ano: 2021, destaque: true, corTema: '#f59e0b', descricao: 'Eleito Jogo do Ano! Aventura cooperativa genial e comovente para dois jogadores.' },
  { id: 'jujutsu-kaisen-cursed-clash', nome: 'Jujutsu Kaisen: Cursed Clash', genero: 'Luta', tamanho: 12, ano: 2024, destaque: false, corTema: '#f48879', descricao: 'Batalhas de feitiçaria 2v2 com Yuji, Megumi, Nobara e Gojo em combates cheios de energia amaldiçoada.' },
  { id: 'jump-force', nome: 'Jump Force', genero: 'Luta', tamanho: 20, ano: 2019, destaque: false, corTema: '#6ab197', descricao: 'Os maiores heróis de Dragon Ball, One Piece, Naruto e Hunter x Hunter juntos no combate.' },
  { id: 'kh-hd-1-5-2-5', nome: 'Kingdom Hearts HD 1.5 + 2.5 ReMIX', genero: 'RPG', tamanho: 50, ano: 2017, destaque: false, corTema: '#1e40af', descricao: 'Seis aventuras clássicas de Sora, Pato Donald e Pateta reunidas em alta resolução.' },
  { id: 'kh-melody-of-memory', nome: 'KINGDOM HEARTS Melody of Memory', genero: 'Aventura', tamanho: 7, ano: 2020, destaque: false, corTema: '#44cd1e', descricao: 'Ação e ritmo com mais de 140 canções memoráveis dos mundos Disney e Square Enix.' },
  { id: 'lies-of-p', nome: 'Lies of P', genero: 'RPG', tamanho: 35, ano: 2023, destaque: true, corTema: '#bb5900', descricao: 'Aclamado souls-like inspirado na fábula de Pinóquio em uma elegante e sombria cidade mecânica.' },
  { id: 'life-is-strange-true-colors', nome: 'Life Is Strange: True Colors', genero: 'Aventura', tamanho: 15, ano: 2021, destaque: false, corTema: '#59db30', descricao: 'Alex Chen desvenda o mistério por trás da morte de seu irmão com seus poderes psíquicos de emoção.' },
  { id: 'little-big-planet-3', nome: 'Little Big Planet 3', genero: 'Aventura', tamanho: 15, ano: 2014, destaque: false, corTema: '#c19e53', descricao: 'Sackboy e seus amigos de pelúcia em aventuras cheias de imaginação, plataforma e quebra-cabeças.' },
  { id: 'little-nightmares', nome: 'Little Nightmares', genero: 'Terror', tamanho: 10, ano: 2017, destaque: false, corTema: '#46894c', descricao: 'Ajude Six a sobreviver e escapar do bizarro e aterrorizante navio submerso The Maw.' },
  { id: 'little-nightmares-2', nome: 'Little Nightmares 2', genero: 'Terror', tamanho: 10, ano: 2021, destaque: true, corTema: '#1e293b', descricao: 'Mono e Six unem forças em um mundo assustador corrompido por uma torre de sinal maligna.' },
  { id: 'little-nightmares-3', nome: 'Little Nightmares III', genero: 'Terror', tamanho: 12, ano: 2024, destaque: false, corTema: '#a84f21', descricao: 'Low e Alone viajam através da misteriosa Nowhere buscando um caminho para sair da escuridão.' },
  { id: 'marvel-ultimate-alliance-2', nome: 'Marvel Ultimate Alliance 2', genero: 'Ação', tamanho: 15, ano: 2016, destaque: false, corTema: '#1d6d8c', descricao: 'A Guerra Civil dos quadrinhos: forme sua equipe com Homem de Ferro, Wolverine ou Capitão América.' },
  { id: 'marvels-guardians-of-the-galaxy', nome: "Marvel's Guardians of the Galaxy", genero: 'Ação', tamanho: 45, ano: 2021, destaque: true, corTema: '#7135bd', descricao: 'Comande Peter Quill, Rocket, Groot e Gamora em uma empolgante comédia de ação espacial.' },
  { id: 'marvels-spiderman', nome: "Marvel's Spider-Man", genero: 'Ação', tamanho: 55, ano: 2018, destaque: true, corTema: '#991b1b', descricao: 'O clássico de Nova York com combates dinâmicos, acrobacias nas teias e vilões lendários.' },
  { id: 'marvels-spiderman-miles-morales', nome: "Marvel's Spider-Man: Miles Morales", genero: 'Ação', tamanho: 40, ano: 2020, destaque: true, corTema: '#b91c1c', descricao: 'Miles aprende a dominar poderes bioelétricos e camuflagem para salvar o Harlem.' },
  { id: 'marvels-avengers', nome: "Marvel's Avengers", genero: 'Ação', tamanho: 55, ano: 2020, destaque: false, corTema: '#2658f5', descricao: 'Kamala Khan reúne os heróis mais poderosos da Terra para enfrentar a organização I.M.A.' },
  { id: 'metal-gear-solid-v', nome: 'Metal Gear Solid V: The Phantom Pain', genero: 'Ação', tamanho: 30, ano: 2015, destaque: false, corTema: '#57534e', descricao: 'Táticas de espionagem e infiltração de mundo aberto com Snake/Big Boss no Afeganistão.' },
  { id: 'minecraft', nome: 'Minecraft', genero: 'Aventura', tamanho: 5, ano: 2014, destaque: true, corTema: '#15803d', descricao: 'Construa, explore mundos infinitos, minere recursos preciosos e sobreviva à noite.' },
  { id: 'monster-hunter-iceborn', nome: 'Monster Hunter World: Iceborne', genero: 'RPG', tamanho: 50, ano: 2019, destaque: true, corTema: '#4d7c0f', descricao: 'Cace feras colossais e dragões anciões na gélida e perigosa Fronteira Glacial.' },
  { id: 'mk-shaolin-monks', nome: 'Mortal Kombat: Shaolin Monks', genero: 'Luta', tamanho: 5, ano: 2018, destaque: false, corTema: '#a4869c', descricao: 'A lendária aventura de combate cooperativo com Liu Kang e Kung Lao derrotando as forças de Shang Tsung.' },
  { id: 'mortal-shell', nome: 'Mortal Shell', genero: 'RPG', tamanho: 9, ano: 2020, destaque: false, corTema: '#fbd31e', descricao: 'Souls-like impiedoso onde você desperta carcaças de guerreiros caídos para desafiar deuses.' },
  { id: 'multiversus', nome: 'Multiversus', genero: 'Luta', tamanho: 15, ano: 2022, destaque: false, corTema: '#4b306a', descricao: 'Luta em plataformas com personagens de Hora de Aventura, DC, Looney Tunes e Scooby-Doo.' },
  { id: 'naruto-boruto-connections', nome: 'Naruto x Boruto Connections', genero: 'Luta', tamanho: 35, ano: 2023, destaque: false, corTema: '#e06c99', descricao: 'O maior elenco de ninjas já reunido com todas as batalhas icônicas do clássico ao Shippuden.' },
  { id: 'outer-wilds', nome: 'Outer Wilds', genero: 'Aventura', tamanho: 8, ano: 2019, destaque: true, corTema: '#d65985', descricao: 'Explore um sistema solar artesanal e curioso preso em um misterioso loop temporal de 22 minutos.' },
  { id: 'outlast-2', nome: 'Outlast 2', genero: 'Terror', tamanho: 25, ano: 2017, destaque: false, corTema: '#851fb4', descricao: 'Investigação aterrorizante no deserto do Arizona contra fanáticos religiosos sanguinários.' },
  { id: 'persona-3-reload', nome: 'Persona 3 Reload', genero: 'RPG', tamanho: 25, ano: 2024, destaque: true, corTema: '#f3b692', descricao: 'A Hora Sombria espera: a recriação espetacular do clássico cult dos RPGs da Atlus.' },
  { id: 'persona-5-royal', nome: 'Persona 5 Royal', genero: 'RPG', tamanho: 40, ano: 2020, destaque: true, corTema: '#b91c1c', descricao: 'Os Phantom Thieves roubam corações corruptos em Tóquio nesta versão definitiva aclamada.' },
  { id: 'pes-17', nome: 'PRO EVOLUTION SOCCER 17', genero: 'Esporte', tamanho: 25, ano: 2016, destaque: false, corTema: '#31adcf', descricao: 'Controle de bola realista, Master League clássica e campeonatos inesquecíveis.' },
  { id: 'rdr-2', nome: 'Red Dead Redemption 2', genero: 'Ação', tamanho: 100, ano: 2018, destaque: true, corTema: '#9a3412', descricao: 'A vida do fora da lei Arthur Morgan no Velho Oeste americano, uma obra-prima da Rockstar.' },
  { id: 're-2-remake', nome: 'Resident Evil 2 Remake Deluxe Edition', genero: 'Terror', tamanho: 25, ano: 2019, destaque: true, corTema: '#450a0a', descricao: 'Leon Kennedy e Claire Redfield tentam sobreviver ao horror claustrofóbico em Raccoon City.' },
  { id: 're-3', nome: 'Resident Evil 3', genero: 'Terror', tamanho: 25, ano: 2020, destaque: false, corTema: '#dd160d', descricao: 'Jill Valentine foge desesperadamente das perseguições implacáveis da arma biológica Nemesis.' },
  { id: 're-4-remake', nome: 'Resident Evil 4 Remake', genero: 'Terror', tamanho: 35, ano: 2023, destaque: true, corTema: '#5aa0c7', descricao: 'Leon viaja a um vilarejo rural na Europa para salvar a filha do presidente em ação pura.' },
  { id: 're-5', nome: 'Resident Evil 5', genero: 'Terror', tamanho: 18, ano: 2016, destaque: false, corTema: '#1a85d5', descricao: 'Chris Redfield e Sheva Alomar enfrentam a ameaça biológica em Kijuju em combate cooperativo.' },
  { id: 're-6', nome: 'Resident Evil 6', genero: 'Terror', tamanho: 18, ano: 2016, destaque: false, corTema: '#48d554', descricao: 'Ação e terror global em múltiplas campanhas entrecruzadas com Leon, Chris, Jake e Ada Wong.' },
  { id: 're-7', nome: 'Resident Evil 7', genero: 'Terror', tamanho: 25, ano: 2017, destaque: true, corTema: '#0c55be', descricao: 'Terror claustrofóbico e visceral em primeira pessoa na bizarra mansão da família Baker.' },
  { id: 're-village', nome: 'Resident Evil Village', genero: 'Terror', tamanho: 30, ano: 2021, destaque: true, corTema: '#5a72c8', descricao: 'Ethan Winters enfrenta horrores no vilarejo dominado por Lady Dimitrescu e lordes misteriosos.' },
  { id: 'sekiro', nome: 'Sekiro: Shadows Die Twice', genero: 'Ação', tamanho: 15, ano: 2019, destaque: true, corTema: '#78350f', descricao: 'Ação ninja implacável com espadas no Japão feudal; jogo do ano pela FromSoftware.' },
  { id: 'shadow-of-the-colossus', nome: 'Shadow of The Colossus', genero: 'Ação', tamanho: 30, ano: 2018, destaque: false, corTema: '#52525b', descricao: 'Derrube 16 colossos majestosos em terras ancestrais nesta emocionante recriação.' },
  { id: 'shadow-of-tomb-raider', nome: 'Shadow of Tomb Raider', genero: 'Aventura', tamanho: 40, ano: 2018, destaque: false, corTema: '#a9e2cf', descricao: 'Lara Croft precisa dominar selvas mortais e salvar o mundo de um apocalipse maia.' },
  { id: 'sifu', nome: 'Sifu', genero: 'Luta', tamanho: 15, ano: 2022, destaque: true, corTema: '#575636', descricao: 'Intensas artes marciais de Kung Fu Pak Mei onde cada derrota custa anos da sua vida.' },
  { id: 'sonic-mania', nome: 'Sonic Mania', genero: 'Aventura', tamanho: 1, ano: 2017, destaque: false, corTema: '#00e499', descricao: 'A celebração definitiva do ouriço azul com as melhores fases e trilhas sonoras clássicas.' },
  { id: 'sonic-x-shadow-generations', nome: 'SONIC X SHADOW GENERATIONS', genero: 'Aventura', tamanho: 20, ano: 2024, destaque: false, corTema: '#99cfbd', descricao: 'Jogue com Shadow the Hedgehog em novos poderes Doom além da remasterização completa de Sonic Generations.' },
  { id: 'spirit-of-the-north', nome: 'Spirit of the North', genero: 'Aventura', tamanho: 4, ano: 2019, destaque: false, corTema: '#b8d914', descricao: 'Controle uma graciosa raposa vermelha desvendando a mitologia nórdica da Islândia.' },
  { id: 'star-wars-jedi-fallen-order', nome: 'Star Wars Jedi Fallen Order Deluxe Edition', genero: 'Ação', tamanho: 50, ano: 2019, destaque: true, corTema: '#871cb4', descricao: 'Cal Kestis empunha seu sabre de luz e a Força escapando do extermínio do Império.' },
  { id: 'stranger-paradise-ffo', nome: 'Stranger Paradise Final Fantasy Origin', genero: 'RPG', tamanho: 40, ano: 2022, destaque: false, corTema: '#7d009d', descricao: 'Combates viscerais de RPG de ação onde Jack e seus companheiros buscam aniquilar o Caos.' },
  { id: 'street-fighter-6', nome: 'Street Fighter 6', genero: 'Luta', tamanho: 45, ano: 2023, destaque: true, corTema: '#025ec2', descricao: 'A consagrada evolução da franquia de luta da Capcom com sistema Drive e batalhas eletrizantes.' },
  { id: 'tales-of-arise', nome: 'Tales of Arise', genero: 'RPG', tamanho: 40, ano: 2021, destaque: false, corTema: '#e1a7f2', descricao: 'Libertação contra séculos de opressão em um RPG com visual deslumbrante e combate veloz.' },
  { id: 'the-callisto-protocol', nome: 'The Callisto Protocol', genero: 'Terror', tamanho: 45, ano: 2022, destaque: false, corTema: '#390d89', descricao: 'Tente sobreviver aos horrores sangrentos e mutações grotescas na prisão da lua de Júpiter.' },
  { id: 'the-crew-2', nome: 'The Crew 2', genero: 'Corrida', tamanho: 35, ano: 2018, destaque: false, corTema: '#b0b741', descricao: 'Dispute corridas em carros, motos, barcos e aviões por todo o território dos Estados Unidos.' },
  { id: 'the-evil-within', nome: 'The Evil Within', genero: 'Terror', tamanho: 35, ano: 2014, destaque: false, corTema: '#4a2526', descricao: 'O survival horror clássico e perturbador de Shinji Mikami em um pesadelo sobrenatural.' },
  { id: 'the-evil-within-2', nome: 'The Evil Whitin 2', genero: 'Terror', tamanho: 35, ano: 2017, destaque: false, corTema: '#70485d', descricao: 'Sebastian Castellanos arrisca tudo descendo à perturbadora cidade de Union para salvar Lily.' },
  { id: 'the-last-of-us-part-ii', nome: 'The Last of Us Part II', genero: 'Ação', tamanho: 100, ano: 2020, destaque: true, corTema: '#988039', descricao: 'A marcante e visceral jornada dramática de vingança e sobrevivência de Ellie em Seattle.' },
  { id: 'the-last-of-us-remastered', nome: 'The Last of Us Reamastered', genero: 'Ação', tamanho: 45, ano: 2014, destaque: true, corTema: '#c33ab8', descricao: 'Joel e Ellie cruzando a América pós-apocalíptica; vencedor de mais de 200 prêmios de Jogo do Ano.' },
  { id: 'the-witcher-3', nome: 'The Witcher 3', genero: 'RPG', tamanho: 50, ano: 2015, destaque: true, corTema: '#ffbefb', descricao: 'Geralt de Rívia busca Ciri pelo Continente devastado em um dos maiores RPGs já criados.' },
  { id: 'uncharted-4', nome: 'Uncharted 4 A Thiefs End', genero: 'Ação', tamanho: 55, ano: 2016, destaque: true, corTema: '#c5910e', descricao: 'A última caçada cinematográfica ao lendário tesouro de Henry Avery com Nathan Drake.' },
  { id: 'until-dawn', nome: 'Until Dawn', genero: 'Terror', tamanho: 40, ano: 2015, destaque: false, corTema: '#58b019', descricao: 'Oito amigos em uma montanha isolada onde suas decisões determinam quem sobrevive até o amanhecer.' },
  { id: 'watch-dogs-2', nome: 'Watch Dogs 2', genero: 'Ação', tamanho: 30, ano: 2016, destaque: false, corTema: '#5e597e', descricao: 'Hackeie a infraestrutura de São Francisco com Marcus e a equipe DedSec.' },
  { id: 'wo-long-fallen-dynasty', nome: 'Wo Long Fallen Dynasty', genero: 'RPG', tamanho: 45, ano: 2023, destaque: false, corTema: '#8478a2', descricao: 'Artes marciais chinesas com espadas em combates intensos na dinastia Han infestada de demônios.' }
];

export default function App() {
  // Estado de seleção dos jogos (armazenando os IDs) - Inicia vazio a pedido do usuário
  const [jogosSelecionadosIds, setJogosSelecionadosIds] = useState<string[]>([]);

  // Identifica se o usuário está no ambiente de desenvolvimento
  const isDev = useMemo(() => isDevEnvironment(), []);

  // Estado das imagens (carrega permanentemente do arquivo src/data/gameCovers.json gravado no projeto)
  const [imagensCustomizadas, setImagensCustomizadas] = useState<Record<string, string>>(() => {
    return { ...(permanentGameCovers as Record<string, string>) };
  });

  // Modal para editar imagem de um jogo (acessível apenas no ambiente de desenvolvimento)
  const [modalEdicaoImagem, setModalEdicaoImagem] = useState<{
    aberto: boolean;
    jogo: Jogo | null;
    urlInput: string;
    previaUrl: string;
  }>({
    aberto: false,
    jogo: null,
    urlInput: '',
    previaUrl: ''
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [carregandoUpload, setCarregandoUpload] = useState(false);

  // Carrega do backend /api/covers em ambiente de desenvolvimento
  useEffect(() => {
    if (isDev) {
      fetch('/api/covers')
        .then(res => res.json())
        .then(data => {
          if (data && typeof data === 'object') {
            setImagensCustomizadas(prev => ({ ...prev, ...data }));
          }
        })
        .catch(() => {});
    }
  }, [isDev]);

  // Filtros de busca
  const [busca, setBusca] = useState('');
  const [generoFiltro, setGeneroFiltro] = useState('Todos');
  const [tamanhoFiltro, setTamanhoFiltro] = useState<'Todos' | 'Pequeno' | 'Médio' | 'Grande'>('Todos');
  const [ordenacao, setOrdenacao] = useState<'padrao' | 'nome' | 'tamanho-desc' | 'tamanho-asc'>('padrao');

  // Estados dos Modais e Drawers
  const [drawerAberto, setDrawerAberto] = useState(false);
  const [modalResumoAberto, setModalResumoAberto] = useState(false);
  const [alertaCapacidade, setAlertaCapacidade] = useState<{ aberto: boolean; jogoTentado?: string; espacoNecessario?: number } | null>(null);
  const [mensagemCopia, setMensagemCopia] = useState<string | null>(null);

  // Gêneros únicos para o filtro
  const generosDisponiveis = useMemo(() => {
    const setGen = new Set<string>();
    JOGOS.forEach(j => setGen.add(j.genero));
    return ['Todos', ...Array.from(setGen).sort()];
  }, []);

  // Cálculos de espaço ocupado (915 GB livres para jogos + 85 GB sistema = 1000 GB)
  const { espacoJogosUsadoGB, espacoTotalUsadoGB, espacoRestanteGB, percentualUsado } = useMemo(() => {
    const jogosAtuais = JOGOS.filter(j => jogosSelecionadosIds.includes(j.id));
    const somaJogos = jogosAtuais.reduce((acc, j) => acc + j.tamanho, 0);
    const totalComSistema = somaJogos + HD_SISTEMA_GB;
    const restante = Math.max(0, HD_DISPONIVEL_JOGOS_GB - somaJogos);
    const percentual = Math.min(100, Math.round((totalComSistema / HD_TOTAL_GB) * 100));

    return {
      espacoJogosUsadoGB: somaJogos,
      espacoTotalUsadoGB: totalComSistema,
      espacoRestanteGB: restante,
      percentualUsado: percentual
    };
  }, [jogosSelecionadosIds]);

  // Cor da barra de progresso conforme regras obrigatórias:
  // verde (<70%), amarelo (70-90%), vermelho (>90%)
  const corProgresso = useMemo(() => {
    if (percentualUsado > 90) return {
      bar: 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]',
      text: 'text-rose-400',
      badge: 'border-rose-500/30 bg-rose-950/40 text-rose-300'
    };
    if (percentualUsado >= 70) return {
      bar: 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.5)]',
      text: 'text-amber-400',
      badge: 'border-amber-500/30 bg-amber-950/40 text-amber-300'
    };
    return {
      bar: 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]',
      text: 'text-emerald-400',
      badge: 'border-emerald-500/30 bg-emerald-950/40 text-emerald-300'
    };
  }, [percentualUsado]);

  // Lista filtrada de jogos
  const jogosFiltrados = useMemo(() => {
    return JOGOS.filter(jogo => {
      // Busca por nome
      if (busca.trim()) {
        const termo = busca.toLowerCase();
        if (!jogo.nome.toLowerCase().includes(termo) && !jogo.genero.toLowerCase().includes(termo)) {
          return false;
        }
      }
      // Filtro de gênero
      if (generoFiltro !== 'Todos' && jogo.genero !== generoFiltro) {
        return false;
      }
      // Filtro de tamanho
      if (tamanhoFiltro === 'Pequeno' && jogo.tamanho >= 30) return false;
      if (tamanhoFiltro === 'Médio' && (jogo.tamanho < 30 || jogo.tamanho > 60)) return false;
      if (tamanhoFiltro === 'Grande' && jogo.tamanho <= 60) return false;

      return true;
    }).sort((a, b) => {
      if (ordenacao === 'nome') return a.nome.localeCompare(b.nome);
      if (ordenacao === 'tamanho-desc') return b.tamanho - a.tamanho;
      if (ordenacao === 'tamanho-asc') return a.tamanho - b.tamanho;
      // Destaques primeiro
      if (a.destaque && !b.destaque) return -1;
      if (!a.destaque && b.destaque) return 1;
      return 0;
    });
  }, [busca, generoFiltro, tamanhoFiltro, ordenacao]);

  // Alternar seleção de um jogo
  const toggleJogo = (jogo: Jogo) => {
    if (jogosSelecionadosIds.includes(jogo.id)) {
      setJogosSelecionadosIds(prev => prev.filter(id => id !== jogo.id));
    } else {
      // Validar capacidade restante (limite 915 GB)
      if (espacoJogosUsadoGB + jogo.tamanho > HD_DISPONIVEL_JOGOS_GB) {
        setAlertaCapacidade({
          aberto: true,
          jogoTentado: jogo.nome,
          espacoNecessario: jogo.tamanho
        });
        return;
      }
      setJogosSelecionadosIds(prev => [...prev, jogo.id]);
    }
  };

  // Remover jogo individual
  const removerJogo = (id: string) => {
    setJogosSelecionadosIds(prev => prev.filter(item => item !== id));
  };

  // Limpar toda a seleção
  const limparSelecao = () => {
    setJogosSelecionadosIds([]);
  };

  // Selecionar todos os visíveis respeitando a capacidade de 915 GB
  const selecionarTodosVisiveis = () => {
    let espacoAtual = espacoJogosUsadoGB;
    const novosIds = [...jogosSelecionadosIds];
    let algumNaoCoube = false;

    jogosFiltrados.forEach(jogo => {
      if (!novosIds.includes(jogo.id)) {
        if (espacoAtual + jogo.tamanho <= HD_DISPONIVEL_JOGOS_GB) {
          novosIds.push(jogo.id);
          espacoAtual += jogo.tamanho;
        } else {
          algumNaoCoube = true;
        }
      }
    });

    setJogosSelecionadosIds(novosIds);
    if (algumNaoCoube) {
      setAlertaCapacidade({
        aberto: true,
        jogoTentado: 'Jogos excedentes da lista',
        espacoNecessario: 0
      });
    }
  };

  // Obter objetos de jogos selecionados
  const jogosSelecionados = useMemo(() => {
    return JOGOS.filter(j => jogosSelecionadosIds.includes(j.id));
  }, [jogosSelecionadosIds]);

  // Obter imagem ativa do jogo (customizada pelo usuário no app ou padrão do objeto)
  const getImagemJogo = (jogo: Jogo): string | undefined => {
    return imagensCustomizadas[jogo.id] || jogo.imagem;
  };

  // Abertura do modal para editar imagem (disponível exclusivamente no ambiente de desenvolvimento)
  const abrirModalEditarImagem = (jogo: Jogo, e: React.MouseEvent) => {
    e.stopPropagation(); // Evita marcar/desmarcar o jogo
    if (!isDev) return;
    const imagemAtual = getImagemJogo(jogo) || '';
    setModalEdicaoImagem({
      aberto: true,
      jogo,
      urlInput: imagemAtual,
      previaUrl: imagemAtual
    });
  };

  // Salvar imagem customizada permanentemente nos arquivos do projeto (/api/covers -> src/data/gameCovers.json)
  const salvarImagemCustomizada = async () => {
    if (!modalEdicaoImagem.jogo) return;
    const jogoId = modalEdicaoImagem.jogo.id;
    const novaUrl = modalEdicaoImagem.urlInput.trim();

    if (novaUrl) {
      setImagensCustomizadas(prev => ({ ...prev, [jogoId]: novaUrl }));
      try {
        await fetch('/api/covers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [jogoId]: novaUrl })
        });
        setMensagemCopia('Capa salva permanentemente no projeto! Nunca sumirá ao limpar cache.');
      } catch (err) {
        console.warn('Erro ao salvar no arquivo local:', err);
        setMensagemCopia('Capa aplicada!');
      }
    } else {
      setImagensCustomizadas(prev => {
        const novo = { ...prev };
        delete novo[jogoId];
        return novo;
      });
      try {
        await fetch('/api/covers', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: jogoId })
        });
      } catch {}
    }

    setTimeout(() => setMensagemCopia(null), 3500);
    setModalEdicaoImagem({ aberto: false, jogo: null, urlInput: '', previaUrl: '' });
  };

  // Redefinir para o padrão PlayStation (remove do arquivo permanente)
  const redefinirImagem = async () => {
    if (!modalEdicaoImagem.jogo) return;
    const jogoId = modalEdicaoImagem.jogo.id;
    setImagensCustomizadas(prev => {
      const novo = { ...prev };
      delete novo[jogoId];
      return novo;
    });
    try {
      await fetch('/api/covers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: jogoId })
      });
    } catch {}
    setModalEdicaoImagem(prev => ({ ...prev, urlInput: '', previaUrl: '' }));
  };

  // Manipular upload de arquivo local de imagem com compressão e otimização para capa PS4
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setCarregandoUpload(true);
      // Redimensiona inteligentemente no canvas para ~35KB (qualidade nítida, peso mínimo)
      const compressedDataUrl = await comprimirImagemParaCapa(file);
      setModalEdicaoImagem(prev => ({
        ...prev,
        urlInput: compressedDataUrl,
        previaUrl: compressedDataUrl
      }));
    } catch (err) {
      console.error('Erro ao processar imagem:', err);
    } finally {
      setCarregandoUpload(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Obter data formatada
  const dataFormatada = useMemo(() => {
    const agora = new Date();
    const dia = String(agora.getDate()).padStart(2, '0');
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const ano = agora.getFullYear();
    const horas = String(agora.getHours()).padStart(2, '0');
    const minutos = String(agora.getMinutes()).padStart(2, '0');
    return `${dia}/${mes}/${ano} ${horas}:${minutos}`;
  }, []);

  // EXPORTAÇÃO A: EXCEL (.xlsx) VIA SHEETJS
  const exportarExcel = () => {
    if (jogosSelecionados.length === 0) return;

    try {
      const wsData: any[][] = [
        ['COTAÇÃO DE JOGOS - HD EXTERNO 1TB PARA PS4 DESBLOQUEADO'],
        [`Data da Cotação: ${dataFormatada}`],
        ['Produto: HD Externo 1TB USB 3.0 Pronto para Plugar (Console Desbloqueado)'],
        [''],
        ['Nº', 'Nome do Jogo', 'Gênero', 'Tamanho (GB)']
      ];

      jogosSelecionados.forEach((j, index) => {
        wsData.push([index + 1, j.nome, j.genero, j.tamanho]);
      });

      wsData.push(['']);
      wsData.push(['---', 'Firmware / Sistema do PS4 (Reservado Fixo)', 'Sistema', HD_SISTEMA_GB]);
      wsData.push(['TOTAL', `TOTAL DE JOGOS: ${jogosSelecionados.length}`, 'TOTAL ESPAÇO OCUPADO', espacoTotalUsadoGB]);
      wsData.push(['', 'Capacidade Máxima do HD', '', `${HD_TOTAL_GB} GB`]);
      wsData.push(['', 'Capacidade Máxima para Jogos', '', `${HD_DISPONIVEL_JOGOS_GB} GB`]);
      wsData.push(['', 'Espaço Livre Restante', '', `${espacoRestanteGB} GB`]);

      const ws = XLSX.utils.aoa_to_sheet(wsData);

      ws['!cols'] = [
        { wch: 8 },  // Nº
        { wch: 45 }, // Nome
        { wch: 20 }, // Gênero
        { wch: 16 }  // Tamanho
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Jogos_PS4_1TB');

      XLSX.writeFile(wb, `Lista_Jogos_PS4_1TB_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      console.error('Erro ao exportar Excel:', err);
    }
  };

  // EXPORTAÇÃO B: TEXTO FORMATADO (.txt)
  const gerarTextoFormatado = () => {
    const linhas: string[] = [];
    linhas.push('----------------------------------------------------');
    linhas.push('LISTA DE JOGOS - HD PS4 1TB DESBLOQUEADO');
    linhas.push(`Data: ${dataFormatada}`);
    linhas.push('Produto: HD Externo 1TB USB 3.0 com Case de Alumínio');
    linhas.push('Status: Pronto para uso imediato (Plug and Play)');
    linhas.push('----------------------------------------------------');
    
    jogosSelecionados.forEach((j, idx) => {
      linhas.push(`${idx + 1}. ${j.nome} - ${j.tamanho} GB [${j.genero}]`);
    });

    linhas.push('----------------------------------------------------');
    linhas.push(`Total de jogos: ${jogosSelecionados.length}`);
    linhas.push(`Espaço reservado sistema PS4: ${HD_SISTEMA_GB} GB`);
    linhas.push(`Espaço utilizado em jogos: ${espacoJogosUsadoGB} GB / ${HD_DISPONIVEL_JOGOS_GB} GB`);
    linhas.push(`Espaço total utilizado (Jogos + Sistema): ${espacoTotalUsadoGB} GB / ${HD_TOTAL_GB} GB`);
    linhas.push(`Espaço livre restante: ${espacoRestanteGB} GB`);
    linhas.push(`Utilização do HD: ${percentualUsado}%`);
    linhas.push('----------------------------------------------------');
    linhas.push('OBSERVAÇÕES:');
    linhas.push('* Todos os jogos acompanham suas respectivas atualizações e patches instalados.');
    linhas.push('* Compatível com PS4 desbloqueado (firmwares 5.05 até 11.00 via GoldHEN).');
    linhas.push('----------------------------------------------------');

    return linhas.join('\n');
  };

  const exportarTxt = () => {
    if (jogosSelecionados.length === 0) return;

    const conteudo = gerarTextoFormatado();
    const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Lista_Jogos_PS4_1TB_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Número de WhatsApp para envio direto dos pedidos (+55 11 91154-3874)
  const WHATSAPP_NUMERO = '5511911543874';

  // Compartilhar no WhatsApp diretamente para o número do vendedor
  const compartilharWhatsApp = () => {
    if (jogosSelecionados.length === 0) return;

    const texto = encodeURIComponent(
      `Olá! Montei minha seleção de jogos para o *HD Externo 1TB PS4 Desbloqueado*:\n\n` +
      `🎮 *Total de jogos:* ${jogosSelecionados.length}\n` +
      `💾 *Espaço em jogos:* ${espacoJogosUsadoGB} GB / ${HD_DISPONIVEL_JOGOS_GB} GB\n` +
      `⚡ *Espaço livre:* ${espacoRestanteGB} GB (${percentualUsado}% do HD ocupado)\n\n` +
      `*Jogos selecionados:*\n` +
      jogosSelecionados.map((j, i) => `${i + 1}. ${j.nome} - ${j.tamanho} GB`).join('\n') +
      `\n\nPodemos fechar o pedido?`
    );
    window.open(`https://api.whatsapp.com/send?phone=${WHATSAPP_NUMERO}&text=${texto}`, '_blank');
  };

  // Copiar resumo para a área de transferência
  const copiarResumo = () => {
    const texto = gerarTextoFormatado();
    navigator.clipboard.writeText(texto).then(() => {
      setMensagemCopia('Lista copiada para a área de transferência!');
      setTimeout(() => setMensagemCopia(null), 3000);
    });
  };

  return (
    <div className="min-h-screen bg-[#090c10] text-slate-100 flex flex-col font-sans">
      
      {/* ====================================================================
          BARRA SUPERIOR FIXA (STICKY CAPACITY BAR)
          Regra de Negócio: Total 1000GB, 85GB Sistema, 915GB Jogos
          Espaço usado, restante, percentual e cores dinâmicas
          ==================================================================== */}
      <header className="sticky top-0 z-40 bg-[#0d121c]/95 backdrop-blur-md border-b border-slate-800 shadow-xl transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          {/* Linha 1: Marca, Status e Botão do Carrinho */}
          <div className="flex items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#0070d1] flex items-center justify-center text-white font-bold shadow-md shadow-[#0070d1]/30">
                <HardDrive className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-base sm:text-lg tracking-tight text-white">
                    HD Externo 1TB PS4
                  </span>
                  <span className="hidden sm:inline-block text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-[#0070d1]/20 text-[#38bdf8] border border-[#0070d1]/30">
                    Pronto para Plugar
                  </span>
                </div>
                <p className="text-xs text-slate-400 hidden sm:block">
                  Case USB 3.0 em alumínio · Desbloqueado 5.05 - 11.00 · {HD_DISPONIVEL_JOGOS_GB} GB livres
                </p>
              </div>
            </div>

            {/* Ações Rápidas do Topo */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setDrawerAberto(true)}
                className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700 text-xs sm:text-sm font-medium transition cursor-pointer"
                title="Ver lista de jogos selecionados"
              >
                <Gamepad2 className="w-4 h-4 text-[#0070d1]" />
                <span>{jogosSelecionados.length} <span className="hidden sm:inline">jogos</span></span>
                <span className="w-2 h-2 rounded-full bg-[#0070d1] animate-pulse"></span>
              </button>

              <button
                onClick={() => setModalResumoAberto(true)}
                disabled={jogosSelecionados.length === 0}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer shadow-sm ${
                  jogosSelecionados.length > 0
                    ? 'bg-[#0070d1] hover:bg-[#005bb0] text-white shadow-[#0070d1]/30'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar</span>
              </button>
            </div>
          </div>

          {/* Linha 2: Barra de Progresso e Métricas de Capacidade */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between text-xs gap-y-1">
              <div className="flex items-center gap-2 sm:gap-4 font-mono tabular-nums">
                <span className="text-slate-300">
                  <span className="text-slate-400">Jogos:</span>{' '}
                  <strong className={corProgresso.text}>{espacoJogosUsadoGB} GB</strong>
                  <span className="text-slate-500"> / {HD_DISPONIVEL_JOGOS_GB} GB</span>
                </span>
                <span className="text-slate-600 hidden md:inline">|</span>
                <span className="text-slate-400 hidden md:inline">
                  Sistema: <strong className="text-slate-300">{HD_SISTEMA_GB} GB</strong>
                </span>
                <span className="text-slate-600 hidden sm:inline">|</span>
                <span className="text-slate-300">
                  Total HD: <strong className="text-white">{espacoTotalUsadoGB} / {HD_TOTAL_GB} GB</strong>
                </span>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs tabular-nums">
                <span className="text-slate-400">Restante:</span>
                <span className={`font-bold ${espacoRestanteGB < 30 ? 'text-rose-400' : 'text-slate-200'}`}>
                  {espacoRestanteGB} GB livres
                </span>
                <span className={`text-[11px] font-bold px-1.5 py-0.2 rounded border ${corProgresso.badge}`}>
                  {percentualUsado}%
                </span>
              </div>
            </div>

            {/* Medidor visual de 1TB particionado */}
            <div className="relative w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-700/60 flex">
              {/* Partição fixa de sistema (85GB = 8.5%) */}
              <div 
                style={{ width: `${(HD_SISTEMA_GB / HD_TOTAL_GB) * 100}%` }}
                className="h-full bg-slate-600/80 rounded-l-full relative group transition-all"
                title={`${HD_SISTEMA_GB} GB Reservado para Firmware e Sistema do PS4`}
              />
              {/* Partição dinâmica de jogos */}
              <div 
                style={{ width: `${(espacoJogosUsadoGB / HD_TOTAL_GB) * 100}%` }}
                className={`h-full ${corProgresso.bar} transition-all duration-300`}
                title={`${espacoJogosUsadoGB} GB ocupados por ${jogosSelecionados.length} jogos`}
              />
            </div>

            {/* Legenda visual compacta */}
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-500 inline-block"></span>
                  Sistema PS4 ({HD_SISTEMA_GB} GB fixo)
                </span>
                <span className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full inline-block ${percentualUsado > 90 ? 'bg-rose-500' : percentualUsado >= 70 ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                  Jogos Selecionados ({espacoJogosUsadoGB} GB)
                </span>
              </div>
              <span className="text-slate-400">
                {percentualUsado >= 90 ? 'HD quase cheio! Pronto para gravação.' : percentualUsado >= 70 ? 'Excelente capacidade aproveitada' : `Escolha até ${HD_DISPONIVEL_JOGOS_GB} GB`}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ====================================================================
          HERO SECTION (Banner Comercial com Imagem do PS4 + HD)
          ==================================================================== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0e1626] to-[#090c10] border-b border-slate-800/80">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,112,209,0.18),rgba(255,255,255,0))] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Texto Hero */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0070d1]/15 border border-[#0070d1]/40 text-[#38bdf8] text-xs font-semibold tracking-wide">
                <Zap className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span>PLUG & PLAY · 100% CONFIGURADO PARA CONSOLES DESBLOQUEADOS</span>
              </div>

              <h1 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-tight">
                HD Externo 1TB para PS4 <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0070d1] via-[#38bdf8] to-cyan-300">
                  Pronto para Plugar
                </span>
              </h1>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
                Case de acrílico USB 3.0 de alta taxa de transferência. Escolha seus jogos favoritos da biblioteca com mais de 100 títulos até preencher os <strong className="text-white">{HD_DISPONIVEL_JOGOS_GB} GB</strong> livres ({HD_SISTEMA_GB} GB já reservados ao sistema). Nós gravamos e enviamos pronto para instalar e jogar!
              </p>

              {/* Vantagens Técnicas em Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Com Case USB 3.0</h4>
                    <p className="text-[11px] text-slate-400">De acrílico transparente</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start gap-2.5">
                  <Gamepad2 className="w-5 h-5 text-[#38bdf8] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Capas originais</h4>
                    <p className="text-[11px] text-slate-400">Encontre seus jogos preferidos!</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start gap-2.5 col-span-2 sm:col-span-1">
                  <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-white">GoldHEN Ready</h4>
                    <p className="text-[11px] text-slate-400">5.05 / 6.72 / 9.00 / 11.00</p>
                  </div>
                </div>
              </div>

              {/* CTAs do Hero */}
              <div className="flex flex-wrap items-center gap-3 pt-3">
                <a
                  href="#catalogo-jogos"
                  className="px-5 py-2.5 rounded-lg bg-[#0070d1] hover:bg-[#005bb0] text-white font-semibold text-sm transition shadow-lg shadow-[#0070d1]/30 flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Monte seu HD agora ({HD_DISPONIVEL_JOGOS_GB} GB)</span>
                </a>
                
                <button
                  onClick={() => setModalResumoAberto(true)}
                  disabled={jogosSelecionados.length === 0}
                  className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-medium transition cursor-pointer flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Exportar Minha Lista ({jogosSelecionados.length})</span>
                </button>
              </div>
            </div>

            {/* Imagem do Produto em Destaque */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-900 shadow-2xl group">
                <img
                  src={heroImage || "/ps4_hd_externo_setup.jpg"}
                  alt="HD Externo 1TB para PS4 em case USB 3.0 conectado ao console"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (!img.src.includes('ps4_hd_externo_setup.jpg')) {
                      img.src = '/ps4_hd_externo_setup.jpg';
                    }
                  }}
                  className="w-full h-auto aspect-video sm:aspect-[16/10] object-cover transition-transform duration-500 group-hover:scale-102"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs">
                  <div className="bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-md border border-slate-700/60 text-slate-200">
                    <span className="font-semibold text-white">Kit Completo:</span> HD 1TB + Case USB 3.0 + Cabo
                  </div>
                  <div className="bg-[#0070d1]/90 text-white font-bold px-2.5 py-1.5 rounded-md shadow">
                    1TB (1000 GB)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          BARRA DE FERRAMENTAS: BUSCA, FILTROS & CONTROLE DA SELEÇÃO
          ==================================================================== */}
      <section id="catalogo-jogos" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-4">
        
        {/* Linha Principal de Controles */}
        <div className="bg-[#0f1522] p-4 rounded-xl border border-slate-800 space-y-3">
          
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Campo de Busca */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar jogos por título (ex: God of War, FIFA, GTA, Dark Souls, Spider-Man)..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                className="w-full pl-10 pr-9 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#0070d1] focus:ring-1 focus:ring-[#0070d1] transition"
              />
              {busca && (
                <button
                  onClick={() => setBusca('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filtro de Tamanho */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 shrink-0">
              <span className="text-xs text-slate-400 mr-1 hidden sm:inline">Tamanho:</span>
              {(['Todos', 'Pequeno', 'Médio', 'Grande'] as const).map(tam => (
                <button
                  key={tam}
                  onClick={() => setTamanhoFiltro(tam)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap cursor-pointer ${
                    tamanhoFiltro === tam
                      ? 'bg-[#0070d1] text-white shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {tam === 'Todos' ? 'Todos os tamanhos' : tam === 'Pequeno' ? '< 30 GB' : tam === 'Médio' ? '30 - 60 GB' : '> 60 GB'}
                </button>
              ))}
            </div>

            {/* Ordenação */}
            <div className="shrink-0 flex items-center gap-2">
              <span className="text-xs text-slate-400 hidden lg:inline">Ordenar:</span>
              <select
                value={ordenacao}
                onChange={e => setOrdenacao(e.target.value as any)}
                className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs font-medium text-slate-200 focus:outline-none focus:border-[#0070d1]"
              >
                <option value="padrao">Destaques Primeiro</option>
                <option value="nome">Nome (A - Z)</option>
                <option value="tamanho-desc">Maior Tamanho (GB)</option>
                <option value="tamanho-asc">Menor Tamanho (GB)</option>
              </select>
            </div>
          </div>

          {/* Filtro de Gêneros (Pills Interativos) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1 scrollbar-none">
            <span className="text-xs text-slate-400 mr-1 shrink-0">Gênero:</span>
            {generosDisponiveis.map(gen => (
              <button
                key={gen}
                onClick={() => setGeneroFiltro(gen)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition whitespace-nowrap cursor-pointer shrink-0 ${
                  generoFiltro === gen
                    ? 'bg-slate-200 text-slate-950 font-semibold'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {gen}
              </button>
            ))}
          </div>

          {/* Barra de Status e Ações em Lote */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
            <div>
              Mostrando <strong className="text-white">{jogosFiltrados.length}</strong> de {JOGOS.length} jogos disponíveis
              {busca && ` para a busca "${busca}"`}
              {generoFiltro !== 'Todos' && ` em ${generoFiltro}`}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={selecionarTodosVisiveis}
                className="px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer"
                title={`Adiciona todos os jogos da visualização atual que couberem no HD (${HD_DISPONIVEL_JOGOS_GB} GB)`}
              >
                Selecionar todos visíveis
              </button>
              
              <button
                onClick={limparSelecao}
                disabled={jogosSelecionados.length === 0}
                className={`px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                  jogosSelecionados.length > 0
                    ? 'bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50'
                    : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                }`}
              >
                Limpar seleção ({jogosSelecionados.length})
              </button>
            </div>
          </div>

        </div>

      </section>

      {/* ====================================================================
          CORPO PRINCIPAL: GRID DE JOGOS + CARD FIXO LATERAL (DESKTOP)
          ==================================================================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* COLUNA ESQUERDA: GRID DE CARDS DE JOGOS */}
          <div className="lg:col-span-8 xl:col-span-9">
            {jogosFiltrados.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-[#0f1522] border border-slate-800">
                <Gamepad2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-1">Nenhum jogo encontrado</h3>
                <p className="text-sm text-slate-400 mb-4">
                  Não encontramos títulos correspondentes aos filtros selecionados.
                </p>
                <button
                  onClick={() => { setBusca(''); setGeneroFiltro('Todos'); setTamanhoFiltro('Todos'); }}
                  className="px-4 py-2 rounded-lg bg-[#0070d1] text-white text-xs font-semibold cursor-pointer"
                >
                  Redefinir filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3.5 sm:gap-4">
                {jogosFiltrados.map(jogo => {
                  const selecionado = jogosSelecionadosIds.includes(jogo.id);
                  const ultrapassaria = !selecionado && (espacoJogosUsadoGB + jogo.tamanho > HD_DISPONIVEL_JOGOS_GB);
                  const imagemAtiva = getImagemJogo(jogo);

                  return (
                    <div
                      key={jogo.id}
                      onClick={() => toggleJogo(jogo)}
                      className={`group relative rounded-xl overflow-hidden border transition-all duration-200 cursor-pointer flex flex-col ${
                        selecionado
                          ? 'bg-[#121c2e] border-[#0070d1] shadow-xl shadow-[#0070d1]/20 ring-2 ring-[#0070d1]'
                          : ultrapassaria
                          ? 'bg-slate-900/60 border-slate-800/80 opacity-65 hover:opacity-100'
                          : 'bg-[#0f1522] border-slate-800 hover:border-slate-600 hover:bg-[#131b2c] shadow-md hover:shadow-xl hover:-translate-y-1'
                      }`}
                    >
                      {/* Faixa Superior Oficial PlayStation 4 (Estilo Estojo Físico PS4) */}
                      <div className="w-full bg-[#003791] px-2.5 py-1 flex items-center justify-between border-b border-blue-400/30 text-white select-none shrink-0 shadow-inner">
                        <div className="flex items-center gap-1.5">
                          <span className="font-display font-black text-xs sm:text-sm tracking-wider text-white">
                            PS4
                          </span>
                          <span className="text-[9px] uppercase tracking-wider text-blue-200 font-semibold hidden min-[400px]:inline">
                            PlayStation 4
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {jogo.destaque && (
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-sans shadow-xs">
                              Hit
                            </span>
                          )}
                          <span className="font-mono text-[10px] font-bold text-blue-100 bg-blue-950/70 px-1.5 py-0.5 rounded border border-blue-400/20">
                            {jogo.tamanho} GB
                          </span>
                        </div>
                      </div>

                      {/* Capa com Proporção Autêntica de Estojo PS4 (Aspect Ratio 3:4 Vertical) */}
                      <div 
                        className="relative w-full aspect-[3/4] flex flex-col justify-end p-3 overflow-hidden select-none bg-slate-950"
                        style={{
                          background: imagemAtiva 
                            ? '#090c10' 
                            : `linear-gradient(145deg, ${jogo.corTema || '#1e293b'} 0%, #090c10 100%)`
                        }}
                      >
                        {/* Imagem da Capa do Jogo */}
                        {imagemAtiva ? (
                          <img
                            src={imagemAtiva}
                            alt={jogo.nome}
                            referrerPolicy="no-referrer"
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => {
                              // Se der erro ao carregar imagem externa, oculta e volta ao estilo gradiente
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          /* Arte Conceitual de Capa com Logotipo quando não houver foto */
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                            <Gamepad2 className="w-10 h-10 text-white/30 mb-2 group-hover:scale-110 transition-transform" />
                            <span className="font-display font-black text-base sm:text-lg text-white/90 drop-shadow uppercase tracking-tight line-clamp-3">
                              {jogo.nome}
                            </span>
                            <span className="text-[11px] text-white/60 font-medium mt-1">
                              {jogo.genero}
                            </span>
                          </div>
                        )}

                        {/* Reflexo Translúcido de Capa Plástica (Efeito Box Art) */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-white/[0.08] pointer-events-none" />

                        {/* Gradiente Escuro na Base para Garantir Legibilidade Máxima */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1522] via-[#0f1522]/60 to-transparent pointer-events-none" />

                        {/* Botão Flutuante de Alterar Capa (Ícone de Câmera) - Apenas em Desenvolvimento */}
                        {isDev && (
                          <div className="absolute top-2 right-2 z-20">
                            <button
                              type="button"
                              onClick={(e) => abrirModalEditarImagem(jogo, e)}
                              className="p-1.5 rounded-full bg-slate-950/80 hover:bg-[#0070d1] text-slate-300 hover:text-white border border-slate-700/60 backdrop-blur-md transition cursor-pointer shadow-md"
                              title="Editar imagem desta capa de jogo (Ambiente de Desenvolvimento)"
                            >
                              <Camera className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Título e Gênero Sobrepostos na Base da Capa */}
                        <div className="relative z-10 w-full">
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-300 font-medium uppercase tracking-wider mb-0.5">
                            <span>{jogo.genero}</span>
                            {jogo.ano && (
                              <>
                                <span>·</span>
                                <span>{jogo.ano}</span>
                              </>
                            )}
                          </div>
                          <h3 className="font-display font-bold text-sm sm:text-base text-white leading-tight line-clamp-2 drop-shadow-md">
                            {jogo.nome}
                          </h3>
                        </div>
                      </div>

                      {/* Rodapé do Card com Checkbox e Ação */}
                      <div className="p-2.5 sm:p-3 bg-[#0f1522] border-t border-slate-800/80 flex items-center justify-between gap-2 mt-auto">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded flex items-center justify-center shrink-0 transition ${
                            selecionado 
                              ? 'bg-[#0070d1] text-white shadow-sm' 
                              : 'border border-slate-600 bg-slate-950/50 group-hover:border-slate-400'
                          }`}>
                            {selecionado && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className={`text-[11px] sm:text-xs font-semibold truncate ${
                            selecionado ? 'text-[#38bdf8]' : 'text-slate-300'
                          }`}>
                            {selecionado ? 'No HD' : 'Adicionar'}
                          </span>
                        </div>

                        {ultrapassaria ? (
                          <span className="text-[10px] sm:text-[11px] text-rose-400 font-medium shrink-0 flex items-center gap-1" title={`Excede o limite restante de ${HD_DISPONIVEL_JOGOS_GB} GB`}>
                            <AlertTriangle className="w-3 h-3" />
                            <span className="hidden min-[380px]:inline">Sem espaço</span>
                          </span>
                        ) : (
                          <span className="font-mono text-[11px] text-slate-400 font-semibold shrink-0">
                            {jogo.tamanho}GB
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* COLUNA DIREITA: CARD LATERAL FIXO (DESKTOP) COM LISTA DE JOGOS SELECIONADOS */}
          <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 sticky top-36">
            <div className="bg-[#0f1522] rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col max-h-[calc(100vh-160px)]">
              
              {/* Cabeçalho do Card Lateral */}
              <div className="p-4 border-b border-slate-800 bg-[#131b2c] flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4 text-[#0070d1]" />
                    <span>Seu HD Personalizado</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {jogosSelecionados.length} de {JOGOS.length} jogos escolhidos
                  </p>
                </div>
                {jogosSelecionados.length > 0 && (
                  <button
                    onClick={limparSelecao}
                    className="text-xs text-rose-400 hover:text-rose-300 transition cursor-pointer"
                  >
                    Limpar
                  </button>
                )}
              </div>

              {/* Status de Espaço Resumido */}
              <div className="p-3 bg-slate-950/60 border-b border-slate-800/80 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Espaço em Jogos:</span>
                  <span className="font-mono font-bold text-white">{espacoJogosUsadoGB} / {HD_DISPONIVEL_JOGOS_GB} GB</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Espaço Livre:</span>
                  <span className={`font-mono font-bold ${espacoRestanteGB < 30 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {espacoRestanteGB} GB
                  </span>
                </div>
                {/* Mini progresso */}
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    style={{ width: `${percentualUsado}%` }}
                    className={`h-full ${corProgresso.bar}`}
                  />
                </div>
              </div>

              {/* Lista Scrollável de Jogos Selecionados */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {jogosSelecionados.length === 0 ? (
                  <div className="text-center py-10 px-4 text-slate-500">
                    <HardDrive className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">Nenhum jogo selecionado ainda.</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Clique nos cards à esquerda para adicionar títulos ao seu HD.
                    </p>
                  </div>
                ) : (
                  jogosSelecionados.map((jogo, index) => (
                    <div
                      key={jogo.id}
                      className="group flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-900/80 hover:bg-slate-900 border border-slate-800 text-xs transition"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-mono text-slate-400 w-4 shrink-0 text-right">
                          {index + 1}.
                        </span>
                        <div className="truncate">
                          <p className="font-medium text-slate-200 truncate">{jogo.nome}</p>
                          <span className="text-[10px] text-slate-400">{jogo.genero}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-slate-300 text-[11px] font-semibold">
                          {jogo.tamanho}GB
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removerJogo(jogo.id);
                          }}
                          className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-rose-950/30 transition cursor-pointer"
                          title="Remover jogo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Botões de Ação Fixos no Rodapé do Card */}
              <div className="p-3 bg-[#131b2c] border-t border-slate-800 space-y-2">
                <button
                  onClick={() => setModalResumoAberto(true)}
                  disabled={jogosSelecionados.length === 0}
                  className={`w-full py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                    jogosSelecionados.length > 0
                      ? 'bg-[#0070d1] hover:bg-[#005bb0] text-white shadow-[#0070d1]/30'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Revisar & Exportar Lista</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={exportarExcel}
                    disabled={jogosSelecionados.length === 0}
                    className="py-1.5 px-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60 text-[11px] font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Excel (.xlsx)</span>
                  </button>

                  <button
                    onClick={exportarTxt}
                    disabled={jogosSelecionados.length === 0}
                    className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    <span>Texto (.txt)</span>
                  </button>
                </div>
              </div>

            </div>
          </aside>

        </div>
      </main>

      {/* ====================================================================
          DRAWER LATERAL PARA MOBILE (LISTA DE JOGOS SELECIONADOS)
          ==================================================================== */}
      {drawerAberto && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop escuro */}
          <div 
            onClick={() => setDrawerAberto(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
          />

          {/* Conteúdo do Drawer */}
          <div className="relative ml-auto w-full max-w-md h-full bg-[#0d121c] border-l border-slate-800 p-4 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-[#0070d1]" />
                <h3 className="font-display font-bold text-white text-base">
                  Jogos Escolhidos ({jogosSelecionados.length})
                </h3>
              </div>
              <button
                onClick={() => setDrawerAberto(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Medidor de Capacidade no Drawer */}
            <div className="py-3 border-b border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Espaço Ocupado:</span>
                <span className="font-mono font-bold text-white">{espacoJogosUsadoGB} / {HD_DISPONIVEL_JOGOS_GB} GB</span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${percentualUsado}%` }}
                  className={`h-full ${corProgresso.bar}`}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Restante: {espacoRestanteGB} GB</span>
                <span>{percentualUsado}% do HD total</span>
              </div>
            </div>

            {/* Lista dos Jogos */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2">
              {jogosSelecionados.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <p className="text-sm">Nenhum jogo selecionado.</p>
                </div>
              ) : (
                jogosSelecionados.map((jogo, idx) => (
                  <div
                    key={jogo.id}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs"
                  >
                    <div className="truncate">
                      <p className="font-medium text-slate-200 truncate">{idx + 1}. {jogo.nome}</p>
                      <span className="text-[10px] text-slate-400">{jogo.genero} · {jogo.tamanho} GB</span>
                    </div>
                    <button
                      onClick={() => removerJogo(jogo.id)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Ações no Drawer */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <button
                onClick={() => {
                  setDrawerAberto(false);
                  setModalResumoAberto(true);
                }}
                disabled={jogosSelecionados.length === 0}
                className="w-full py-2.5 rounded-lg bg-[#0070d1] text-white font-bold text-sm flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Revisar & Exportar</span>
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={exportarExcel}
                  disabled={jogosSelecionados.length === 0}
                  className="py-2 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel (.xlsx)</span>
                </button>
                <button
                  onClick={exportarTxt}
                  disabled={jogosSelecionados.length === 0}
                  className="py-2 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Texto (.txt)</span>
                </button>
              </div>

              <button
                onClick={compartilharWhatsApp}
                disabled={jogosSelecionados.length === 0}
                className="w-full py-2.5 rounded-lg bg-[#25D366] hover:bg-[#1ebd5b] text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50 shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar para WhatsApp (+55 11 91154-3874)</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL INTERATIVO PARA EDITAR / ADICIONAR IMAGEM DO JOGO
          Disponível exclusivamente no ambiente de desenvolvimento
          ==================================================================== */}
      {isDev && modalEdicaoImagem.aberto && modalEdicaoImagem.jogo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#0f1522] rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
            
            {/* Header do Modal */}
            <div className="p-4 border-b border-slate-800 bg-[#131b2c] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0070d1] flex items-center justify-center text-white">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-base text-white">
                      Editar Capa do Jogo
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                      Modo Dev
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {modalEdicaoImagem.jogo.nome}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setModalEdicaoImagem({ aberto: false, jogo: null, urlInput: '', previaUrl: '' })}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corpo do Modal */}
            <div className="p-5 space-y-4">
              
              {/* Pré-visualização da Capa em formato estojo PS4 */}
              <div className="text-center">
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Pré-visualização da Capa (Formato Estojo PS4):
                </label>
                <div className="w-48 aspect-[3/4] mx-auto rounded-xl overflow-hidden border border-slate-700 shadow-xl flex flex-col bg-slate-950">
                  {/* Faixa Superior Oficial PS4 */}
                  <div className="w-full bg-[#003791] px-2.5 py-1 flex items-center justify-between text-white select-none shrink-0 border-b border-blue-400/20">
                    <span className="font-display font-black text-xs tracking-wider">PS4</span>
                    <span className="text-[9px] uppercase tracking-wider text-blue-200 font-semibold">PlayStation 4</span>
                  </div>

                  {/* Área da Imagem */}
                  <div 
                    className="relative flex-1 flex flex-col justify-end p-2.5 overflow-hidden select-none bg-slate-900"
                    style={{
                      background: modalEdicaoImagem.previaUrl 
                        ? '#090c10' 
                        : `linear-gradient(145deg, ${modalEdicaoImagem.jogo.corTema || '#1e293b'} 0%, #090c10 100%)`
                    }}
                  >
                    {modalEdicaoImagem.previaUrl && (
                      <img
                        src={modalEdicaoImagem.previaUrl}
                        alt="Prévia"
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={() => {
                          // Se falhar a prévia
                        }}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-white/[0.08] pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f1522] via-[#0f1522]/60 to-transparent pointer-events-none" />

                    <div className="relative z-10 text-left">
                      <span className="text-[10px] uppercase font-semibold text-slate-300">
                        {modalEdicaoImagem.jogo.genero}
                      </span>
                      <h4 className="font-bold text-white text-sm leading-tight line-clamp-2">
                        {modalEdicaoImagem.jogo.nome}
                      </h4>
                    </div>
                  </div>
                </div>
              </div>

              {/* Opção 1: Colar URL da Imagem (Imgur ou URL Direta) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-200">
                    Link da Imagem (Recomendado: Imgur ou URL Web):
                  </label>
                  <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/80">
                    Gravação Permanente
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://i.imgur.com/exemplo.jpg"
                    value={modalEdicaoImagem.urlInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setModalEdicaoImagem(prev => ({
                        ...prev,
                        urlInput: val,
                        previaUrl: val
                      }));
                    }}
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0070d1]"
                  />
                  {modalEdicaoImagem.urlInput && (
                    <button
                      type="button"
                      onClick={() => setModalEdicaoImagem(prev => ({ ...prev, urlInput: '', previaUrl: '' }))}
                      className="px-2.5 py-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs border border-slate-700 cursor-pointer"
                    >
                      Limpar
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  💡 <strong>Sem limite de espaço:</strong> Cole o link direto do Imgur (<code className="text-slate-300 font-mono text-[10px]">https://i.imgur.com/...jpg</code>). Ao salvar, ele é gravado permanentemente nos arquivos do projeto (<code className="text-slate-300 font-mono text-[10px]">src/data/gameCovers.json</code>) e <strong>nunca se perderá ao limpar o cache</strong> do navegador ou recarregar a página!
                </p>
              </div>

              {/* Opção 2: Carregar do Computador */}
              <div className="pt-2 border-t border-slate-800/80">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Ou faça upload do seu computador:
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={carregandoUpload}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-dashed border-slate-700 hover:border-slate-500 text-xs text-slate-300 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60"
                >
                  <Upload className={`w-4 h-4 text-[#38bdf8] ${carregandoUpload ? 'animate-spin' : ''}`} />
                  <span>{carregandoUpload ? 'Otimizando imagem para formato PS4...' : 'Escolher arquivo de imagem local'}</span>
                </button>
              </div>

              {/* Opções de Redefinição */}
              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={redefinirImagem}
                  className="text-slate-400 hover:text-amber-300 flex items-center gap-1 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Voltar à capa padrão PlayStation</span>
                </button>
              </div>

            </div>

            {/* Rodapé do Modal */}
            <div className="p-4 border-t border-slate-800 bg-[#131b2c] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalEdicaoImagem({ aberto: false, jogo: null, urlInput: '', previaUrl: '' })}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={salvarImagemCustomizada}
                className="px-5 py-2 rounded-lg bg-[#0070d1] hover:bg-[#005bb0] text-white text-xs font-bold transition shadow-md shadow-[#0070d1]/30 cursor-pointer"
              >
                Salvar Imagem (Gravação Permanente)
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL DE RESUMO FINAL & EXPORTAÇÃO
          ==================================================================== */}
      {modalResumoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-[#0f1522] rounded-2xl border border-slate-700 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* Header do Modal */}
            <div className="p-5 border-b border-slate-800 bg-[#131b2c] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0070d1] flex items-center justify-center text-white shadow-md">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-white">
                    Resumo do seu HD PS4 1TB
                  </h3>
                  <p className="text-xs text-slate-400">
                    Cotação gerada em {dataFormatada}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setModalResumoAberto(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Aviso se o HD estiver >= 90% cheio */}
            {percentualUsado >= 90 && (
              <div className="bg-amber-950/40 border-b border-amber-800/50 px-5 py-2.5 flex items-center gap-2.5 text-xs text-amber-300">
                <Info className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>HD com excelente aproveitamento ({percentualUsado}%)!</strong> Restam apenas {espacoRestanteGB} GB livres dos {HD_DISPONIVEL_JOGOS_GB} GB. Não se preocupe, no espaço livre será adicionado um jogo aleatório.
                </span>
              </div>
            )}

            {/* Painel de Métricas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-950/60 border-b border-slate-800 text-center">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Jogos Escolhidos</span>
                <span className="font-display font-bold text-lg text-white">{jogosSelecionados.length}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Espaço em Jogos</span>
                <span className="font-mono font-bold text-lg text-[#38bdf8]">{espacoJogosUsadoGB} GB</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Sistema PS4 (Fixo)</span>
                <span className="font-mono font-bold text-lg text-slate-300">{HD_SISTEMA_GB} GB</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Espaço Livre</span>
                <span className={`font-mono font-bold text-lg ${espacoRestanteGB < 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {espacoRestanteGB} GB
                </span>
              </div>
            </div>

            {/* Lista dos Jogos na Cotação */}
            <div className="flex-1 overflow-y-auto p-5 space-y-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Lista detalhada dos títulos selecionados:
              </h4>

              <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                {jogosSelecionados.map((jogo, index) => (
                  <div key={jogo.id} className="p-2.5 sm:px-4 flex items-center justify-between text-xs hover:bg-slate-900/60 transition">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-400 w-5 text-right">{index + 1}.</span>
                      <div>
                        <span className="font-semibold text-white">{jogo.nome}</span>
                        <span className="text-[11px] text-slate-400 ml-2">({jogo.genero})</span>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/50">
                      {jogo.tamanho} GB
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rodapé com Botões de Exportação Obrigatórios */}
            <div className="p-5 border-t border-slate-800 bg-[#131b2c] space-y-3">
              {mensagemCopia && (
                <div className="p-2 rounded bg-emerald-950/70 border border-emerald-800 text-xs text-emerald-300 text-center font-medium">
                  {mensagemCopia}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Exportar Excel */}
                <button
                  onClick={exportarExcel}
                  className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-900/30"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Exportar Excel (.xlsx)</span>
                </button>

                {/* Exportar TXT */}
                <button
                  onClick={exportarTxt}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm border border-slate-700 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span>Exportar Texto (.txt)</span>
                </button>

                {/* Enviar pelo WhatsApp */}
                <button
                  onClick={compartilharWhatsApp}
                  className="py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#1ebd5b] text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-950/40"
                  title="Enviar lista diretamente para o WhatsApp +55 11 91154-3874"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar para WhatsApp</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <button
                  onClick={copiarResumo}
                  className="hover:text-slate-200 transition underline underline-offset-2 cursor-pointer"
                >
                  Copiar texto formatado
                </button>
                <span>Formatado para envio imediato ao vendedor</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL DE ALERTA DE ESPAÇO INSUFICIENTE
          Regra de Negócio: Alerta quando tentar ultrapassar 915 GB
          ==================================================================== */}
      {alertaCapacidade && alertaCapacidade.aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#131b2c] rounded-2xl border border-rose-500/40 p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-950/60 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="font-display font-bold text-xl text-white">
                Espaço Insuficiente no HD!
              </h3>
              <p className="text-sm text-slate-300">
                Não é possível adicionar <strong className="text-rose-300">{alertaCapacidade.jogoTentado}</strong>.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1.5 text-left font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Capacidade máxima de jogos:</span>
                <span className="text-white font-bold">{HD_DISPONIVEL_JOGOS_GB} GB</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Espaço ocupado atual:</span>
                <span className="text-amber-400 font-bold">{espacoJogosUsadoGB} GB</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Espaço livre restante:</span>
                <span className="text-rose-400 font-bold">{espacoRestanteGB} GB</span>
              </div>
              {alertaCapacidade.espacoNecessario ? (
                <div className="flex justify-between text-slate-300 border-t border-slate-800 pt-1 font-bold">
                  <span>Tamanho do jogo:</span>
                  <span className="text-white">{alertaCapacidade.espacoNecessario} GB (Faltam {alertaCapacidade.espacoNecessario - espacoRestanteGB} GB)</span>
                </div>
              ) : null}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Remova um ou mais jogos da sua seleção atual ou escolha títulos menores para liberar espaço no HD.
            </p>

            <button
              onClick={() => setAlertaCapacidade(null)}
              className="w-full py-2.5 rounded-xl bg-[#0070d1] hover:bg-[#005bb0] text-white font-semibold text-sm transition cursor-pointer"
            >
              Entendi, vou ajustar minha lista
            </button>
          </div>
        </div>
      )}

      {/* ====================================================================
          RODAPÉ (AVISO LEGAL OBRIGATÓRIO & CRÉDITOS)
          ==================================================================== */}
      <footer className="mt-auto border-t border-slate-800 bg-[#070a0e] py-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#0070d1] flex items-center justify-center text-white font-bold">
                <HardDrive className="w-3.5 h-3.5" />
              </div>
              <span className="font-display font-bold text-slate-200">
                HD Externo 1TB PS4 Customizer
              </span>
            </div>

            <div className="flex items-center gap-4 text-slate-400 text-xs">
              <span>Capacidade Total: {HD_TOTAL_GB} GB</span>
              <span>·</span>
              <span>Firmware Reservado: {HD_SISTEMA_GB} GB</span>
              <span>·</span>
              <span>Líquido para Jogos: {HD_DISPONIVEL_JOGOS_GB} GB</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] leading-relaxed text-slate-400">
            <strong className="text-slate-300">Aviso Legal:</strong> Produto destinado a consoles desbloqueados. Venda de mídia física/digital conforme legislação vigente. Todas as marcas, títulos de jogos e logotipos são propriedades de seus respectivos detentores e desenvolvedores.
          </div>

          <div className="text-center text-[11px] text-slate-400 pt-2">
            © {new Date().getFullYear()} HD Externo PS4 Desbloqueado · Sistema desenvolvido por Pettatech
          </div>
        </div>
      </footer>

    </div>
  );
}
