// Metadados do catálogo oficial (Martendal Weekend 2026 - Quarto de Milha).
// Extraídos do PDF oficial. As páginas são as próprias imagens renderizadas do PDF,
// usadas apenas para navegação, tracking e mensagens de WhatsApp.

export type CatalogLot = {
  lotNumber: string;
  horseName: string;
  owner: string;
  pages: string[];
  videoUrl: string | null;
};

export const CATALOG_NAME = "Quarto de Milha - Martendal Weekend 2026";
export const CATALOG_PATH = "/catalago/leilao-martendal-weekend-2026";
export const CATALOG_COVER = "/catalogo/p01.webp";
export const CATALOG_OG_IMAGE = "/catalogo/og.webp";
export const PAGE_WIDTH = 1400;
export const PAGE_HEIGHT = 2489;

export const CATALOG_EXTRA_PAGES: string[] = ["/catalogo/p55.webp", "/catalogo/p56.webp", "/catalogo/p57.webp"];

export const CATALOG_LOTS: CatalogLot[] = [
  { lotNumber: "-100", horseName: "TINSELTOWN GUN", owner: "RANCHO KR", pages: ["/catalogo/p02.webp"], videoUrl: "https://youtu.be/lDOSkYSfObg" },
  { lotNumber: "01", horseName: "SPOOKS GOTTA SHINE", owner: "MARCUS FERRARI / AFFONSO CANDIDO", pages: ["/catalogo/p03.webp", "/catalogo/p04.webp"], videoUrl: "https://youtu.be/kFLJitZXKUc" },
  { lotNumber: "02", horseName: "DIRTY VOODOO", owner: "MARCUS FERRARI / HARAS FRANGE", pages: ["/catalogo/p05.webp", "/catalogo/p06.webp"], videoUrl: "https://youtu.be/uJJ4geQ9dEs" },
  { lotNumber: "03", horseName: "POP ORANGE", owner: "RANCHO MARTENDAL", pages: ["/catalogo/p07.webp"], videoUrl: "https://youtu.be/_9SC1Oz7z-0" },
  { lotNumber: "04", horseName: "GALLO GUNNERS", owner: "RANCHO MARTENDAL", pages: ["/catalogo/p08.webp"], videoUrl: "https://youtu.be/D8jpf3Z6pJI" },
  { lotNumber: "05", horseName: "NN", owner: "HARAS SANTA FELICITÁ", pages: ["/catalogo/p09.webp"], videoUrl: "https://youtu.be/DAivjmpTFOo" },
  { lotNumber: "06", horseName: "SPETACULO HOT GUNNER", owner: "RANCHO MARTENDAL", pages: ["/catalogo/p10.webp"], videoUrl: "https://youtu.be/2Da8ffPqIfk" },
  { lotNumber: "07", horseName: "GALLO BEST GUN", owner: "RANCHO MARTENDAL", pages: ["/catalogo/p11.webp"], videoUrl: "https://youtu.be/Yxt7-xoht0Q" },
  { lotNumber: "08", horseName: "QUEN BUCKS GUN", owner: "RANCHO MARTENDAL", pages: ["/catalogo/p12.webp"], videoUrl: "https://youtu.be/928gLhhnuXc" },
  { lotNumber: "09", horseName: "CAT JAGUAR", owner: "RANCHO MARTENDAL", pages: ["/catalogo/p13.webp"], videoUrl: null },
  { lotNumber: "10", horseName: "POESY GOTTA GUN", owner: "RANCHO MARTENDAL", pages: ["/catalogo/p14.webp"], videoUrl: "https://youtu.be/UlorBaLuofE" },
  { lotNumber: "11", horseName: "SUIT GUNNERS", owner: "RANCHO MARTENDAL", pages: ["/catalogo/p15.webp"], videoUrl: "https://youtu.be/yH1Quahv-CE" },
  { lotNumber: "12", horseName: "BEST GUN ZORREIRO", owner: "RANCHO MARTENDAL", pages: ["/catalogo/p16.webp"], videoUrl: "https://youtu.be/ywEs0sqX0_c" },
  { lotNumber: "13", horseName: "GALLO STARBUCK", owner: "RANCHO MARTENDAL", pages: ["/catalogo/p17.webp"], videoUrl: "https://youtu.be/WbXhYtqMbtY" },
  { lotNumber: "14", horseName: "SWEET JAGUAR ROXO", owner: "RANCHO MARTENDAL", pages: ["/catalogo/p18.webp"], videoUrl: "https://youtu.be/0GsEUEOSBiY" },
  { lotNumber: "15", horseName: "REIN ROCK DUAL", owner: "RANCHO MARTENDAL", pages: ["/catalogo/p19.webp"], videoUrl: "https://youtu.be/wpSTX4DOTNk" },
  { lotNumber: "16", horseName: "ORANGE GALLO GUNNER", owner: "RANCHO MARTENDAL", pages: ["/catalogo/p20.webp"], videoUrl: "https://youtu.be/4efKdbw2MlE" },
  { lotNumber: "17", horseName: "PRINCESS FROM A STAR", owner: "RANCHO MARTENDAL", pages: ["/catalogo/p21.webp"], videoUrl: null },
  { lotNumber: "18", horseName: "CAT STARLIGHT", owner: "RANCHO MARTENDAL", pages: ["/catalogo/p22.webp"], videoUrl: "https://youtu.be/J18nl-bEZ-w" },
  { lotNumber: "19", horseName: "GALLO SPRING STEP", owner: "RANCHO MARTENDAL", pages: ["/catalogo/p23.webp"], videoUrl: "https://youtu.be/at-VIoLbvvc" },
  { lotNumber: "20", horseName: "ONE QUEEN BUCKS TPC", owner: "RANCHO MARTENDAL", pages: ["/catalogo/p24.webp"], videoUrl: "https://youtu.be/d3KrHXfqDSw" },
  { lotNumber: "21", horseName: "SWEET ZORREIRO", owner: "RANCHO MARTENDAL", pages: ["/catalogo/p25.webp"], videoUrl: "https://youtu.be/RHd4q7SX7dc" },
  { lotNumber: "22", horseName: "CATCHEME GALLO", owner: "RANCHO MARTENDAL", pages: ["/catalogo/p26.webp"], videoUrl: "https://youtu.be/Pb_p2Vn6XAg" },
  { lotNumber: "23", horseName: "ASUGAR GUNNERS", owner: "RANCHO MARTENDAL", pages: ["/catalogo/p27.webp"], videoUrl: "https://youtu.be/UXb3XJA9BVc" },
  { lotNumber: "24", horseName: "POESY GUNNERS", owner: "RANCHO MARTENDAL", pages: ["/catalogo/p28.webp"], videoUrl: "https://youtu.be/1DO1FVa6tFo" },
  { lotNumber: "25", horseName: "CHEX FRON SPARK", owner: "RANCHO MARTENDAL", pages: ["/catalogo/p29.webp"], videoUrl: "https://youtu.be/gg5OIMzXrek" },
  { lotNumber: "26", horseName: "MISS SUN SHINE", owner: "RANCHO MARTENDAL", pages: ["/catalogo/p30.webp"], videoUrl: "https://youtu.be/74LBk16thwA" },
  { lotNumber: "27", horseName: "LILY BETH DUAL", owner: "RANCHO MARTENDAL", pages: ["/catalogo/p31.webp"], videoUrl: "https://youtu.be/jVteddPJskc" },
  { lotNumber: "28", horseName: "DUALMINIC STARBUCK", owner: "RANCHO MARTENDAL", pages: ["/catalogo/p32.webp"], videoUrl: "https://youtu.be/R-yLI5WZCIM" },
  { lotNumber: "29", horseName: "CÁSSIA GUNNERS SPARK", owner: "RANCHO MARTENDAL", pages: ["/catalogo/p33.webp"], videoUrl: "https://youtu.be/9u-x7f-khqk" },
  { lotNumber: "30", horseName: "CATGUN GALLO", owner: "RANCHO MARTENDAL", pages: ["/catalogo/p34.webp"], videoUrl: "https://youtu.be/f_CO6Lb_X0M" },
  { lotNumber: "31", horseName: "ORANGE GUN", owner: "RANCHO MARTENDAL", pages: ["/catalogo/p35.webp"], videoUrl: "https://youtu.be/SK6qN4li-hc" },
  { lotNumber: "32", horseName: "POESY WHIZ", owner: "RANCHO MARTENDAL", pages: ["/catalogo/p36.webp"], videoUrl: "https://youtu.be/sp1CbgqECI4" },
  { lotNumber: "33", horseName: "GYPSY COUNTRY GUN", owner: "RANCHO MARTENDAL", pages: ["/catalogo/p37.webp"], videoUrl: "https://youtu.be/v2HTbR9S2_s" },
  { lotNumber: "34", horseName: "REIN ROCK CIELO", owner: "RANCHO MARTENDAL", pages: ["/catalogo/p38.webp"], videoUrl: "https://youtu.be/tTyoKPIvt1I" },
  { lotNumber: "35", horseName: "JDR CASSIA SPARK", owner: "RANCHO MARTENDAL", pages: ["/catalogo/p39.webp"], videoUrl: "https://youtu.be/FMPrMXR3ZPs" },
  { lotNumber: "36", horseName: "SPOOK RUN SPOOKS", owner: "RANCHO MARTENDAL", pages: ["/catalogo/p40.webp"], videoUrl: "https://youtu.be/jqoi3WgWTYo" },
  { lotNumber: "37", horseName: "CATCHEME GOTTA GUN", owner: "RANCHO MARTENDAL", pages: ["/catalogo/p41.webp"], videoUrl: "https://youtu.be/_wrZYaljVCk" },
  { lotNumber: "38", horseName: "HOLLYWOOD BEST GUN", owner: "RANCHO MARTENDAL", pages: ["/catalogo/p42.webp"], videoUrl: "https://youtu.be/OAUhPCY0e4w" },
  { lotNumber: "39", horseName: "ORANGE STARLIGHT", owner: "RANCHO MARTENDAL", pages: ["/catalogo/p43.webp"], videoUrl: "https://youtu.be/EKCRoEGvCIE" },
  { lotNumber: "40", horseName: "KHALEESI", owner: "RANCHO MARTENDAL", pages: ["/catalogo/p44.webp"], videoUrl: "https://youtu.be/8nVET_CFK_I" },
  { lotNumber: "41", horseName: "DOMINIQUE STARBUCK", owner: "RANCHO MARTENDAL", pages: ["/catalogo/p45.webp"], videoUrl: "https://youtu.be/p6NPd277OXs" },
  { lotNumber: "42", horseName: "IZZY ZORREIRO FV", owner: "AGRO RIO RANCH", pages: ["/catalogo/p46.webp"], videoUrl: "https://youtu.be/t1JDudhlX8Q" },
  { lotNumber: "43", horseName: "CAT PEPPY GRAY", owner: "RANCHO DAKOTA", pages: ["/catalogo/p47.webp"], videoUrl: "https://youtu.be/HD65MIrKp6U" },
  { lotNumber: "44", horseName: "CASH LENA BADGER", owner: "CANAÃ AGROPECUÁRIA FAZENDA LIBERDADE", pages: ["/catalogo/p48.webp"], videoUrl: "https://youtu.be/bCobfXPwKxU" },
  { lotNumber: "45", horseName: "LADY POP BELL FAFJ", owner: "RANCHO DURVAL FARIA", pages: ["/catalogo/p49.webp"], videoUrl: "https://youtu.be/04ESISGcyRM" },
  { lotNumber: "46", horseName: "DOLITA DUNIT PATRON", owner: "CANAÃ AGROPECUÁRIA FAZENDA LIBERDADE", pages: ["/catalogo/p50.webp"], videoUrl: "https://youtu.be/0fV_VxK0KjY" },
  { lotNumber: "47", horseName: "SLEEPING WRANGLER", owner: "AGRO RIO RANCH", pages: ["/catalogo/p51.webp"], videoUrl: "https://youtu.be/Pk5XNhZuEPM" },
  { lotNumber: "48", horseName: "SKY TINY DUNIT", owner: "HARAS WG", pages: ["/catalogo/p52.webp"], videoUrl: "https://youtu.be/1u6i8fG2gQc" },
  { lotNumber: "49", horseName: "NN.", owner: "JD RANCH", pages: ["/catalogo/p53.webp"], videoUrl: null },
  { lotNumber: "51", horseName: "RED MONOPOLY DRT", owner: "RANCHO DAKOTA", pages: ["/catalogo/p54.webp"], videoUrl: "https://youtu.be/cB85ji0hyUU" },
];
