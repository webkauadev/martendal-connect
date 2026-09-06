// Metadados do catálogo oficial (Martendal Weekend 2026 - Quarto de Milha).
// Extraídos do PDF oficial. As páginas são as próprias imagens renderizadas do PDF,
// usadas apenas para navegação, tracking e mensagens de WhatsApp.

import p01 from "@/assets/catalogo/p01.webp.asset.json";
import p02 from "@/assets/catalogo/p02.webp.asset.json";
import p03 from "@/assets/catalogo/p03.webp.asset.json";
import p04 from "@/assets/catalogo/p04.webp.asset.json";
import p05 from "@/assets/catalogo/p05.webp.asset.json";
import p06 from "@/assets/catalogo/p06.webp.asset.json";
import p07 from "@/assets/catalogo/p07.webp.asset.json";
import p08 from "@/assets/catalogo/p08.webp.asset.json";
import p09 from "@/assets/catalogo/p09.webp.asset.json";
import p10 from "@/assets/catalogo/p10.webp.asset.json";
import p11 from "@/assets/catalogo/p11.webp.asset.json";
import p12 from "@/assets/catalogo/p12.webp.asset.json";
import p13 from "@/assets/catalogo/p13.webp.asset.json";
import p14 from "@/assets/catalogo/p14.webp.asset.json";
import p15 from "@/assets/catalogo/p15.webp.asset.json";
import p16 from "@/assets/catalogo/p16.webp.asset.json";
import p17 from "@/assets/catalogo/p17.webp.asset.json";
import p18 from "@/assets/catalogo/p18.webp.asset.json";
import p19 from "@/assets/catalogo/p19.webp.asset.json";
import p20 from "@/assets/catalogo/p20.webp.asset.json";
import p21 from "@/assets/catalogo/p21.webp.asset.json";
import p22 from "@/assets/catalogo/p22.webp.asset.json";
import p23 from "@/assets/catalogo/p23.webp.asset.json";
import p24 from "@/assets/catalogo/p24.webp.asset.json";
import p25 from "@/assets/catalogo/p25.webp.asset.json";
import p26 from "@/assets/catalogo/p26.webp.asset.json";
import p27 from "@/assets/catalogo/p27.webp.asset.json";
import p28 from "@/assets/catalogo/p28.webp.asset.json";
import p29 from "@/assets/catalogo/p29.webp.asset.json";
import p30 from "@/assets/catalogo/p30.webp.asset.json";
import p31 from "@/assets/catalogo/p31.webp.asset.json";
import p32 from "@/assets/catalogo/p32.webp.asset.json";
import p33 from "@/assets/catalogo/p33.webp.asset.json";
import p34 from "@/assets/catalogo/p34.webp.asset.json";
import p35 from "@/assets/catalogo/p35.webp.asset.json";
import p36 from "@/assets/catalogo/p36.webp.asset.json";
import p37 from "@/assets/catalogo/p37.webp.asset.json";
import p38 from "@/assets/catalogo/p38.webp.asset.json";
import p39 from "@/assets/catalogo/p39.webp.asset.json";
import p40 from "@/assets/catalogo/p40.webp.asset.json";
import p41 from "@/assets/catalogo/p41.webp.asset.json";
import p42 from "@/assets/catalogo/p42.webp.asset.json";
import p43 from "@/assets/catalogo/p43.webp.asset.json";
import p44 from "@/assets/catalogo/p44.webp.asset.json";
import p45 from "@/assets/catalogo/p45.webp.asset.json";
import p46 from "@/assets/catalogo/p46.webp.asset.json";
import p47 from "@/assets/catalogo/p47.webp.asset.json";
import p48 from "@/assets/catalogo/p48.webp.asset.json";
import p49 from "@/assets/catalogo/p49.webp.asset.json";
import p50 from "@/assets/catalogo/p50.webp.asset.json";
import p51 from "@/assets/catalogo/p51.webp.asset.json";
import p52 from "@/assets/catalogo/p52.webp.asset.json";
import p53 from "@/assets/catalogo/p53.webp.asset.json";
import p54 from "@/assets/catalogo/p54.webp.asset.json";
import p55 from "@/assets/catalogo/p55.webp.asset.json";
import p56 from "@/assets/catalogo/p56.webp.asset.json";
import p57 from "@/assets/catalogo/p57.webp.asset.json";
import ogAsset from "@/assets/catalogo/og.webp.asset.json";
import pdfAsset from "@/assets/catalogo/catalogo.pdf.asset.json";

export type CatalogLot = {
  lotNumber: string;
  horseName: string;
  owner: string;
  pages: string[];
  videoUrl: string | null;
};

export const CATALOG_NAME = "Quarto de Milha - Martendal Weekend 2026";
export const CATALOG_PATH = "/catalago/leilao-martendal-weekend-2026";
export const CATALOG_COVER = p01.url;
export const CATALOG_OG_IMAGE = ogAsset.url;
export const CATALOG_PDF_URL = pdfAsset.url;
export const PAGE_WIDTH = 1400;
export const PAGE_HEIGHT = 2489;

export const CATALOG_EXTRA_PAGES: string[] = [p55.url, p56.url, p57.url];

export const CATALOG_LOTS: CatalogLot[] = [
  { lotNumber: "-100", horseName: "TINSELTOWN GUN", owner: "RANCHO KR", pages: [p02.url], videoUrl: "https://youtu.be/lDOSkYSfObg" },
  { lotNumber: "01", horseName: "SPOOKS GOTTA SHINE", owner: "MARCUS FERRARI / AFFONSO CANDIDO", pages: [p03.url, p04.url], videoUrl: "https://youtu.be/kFLJitZXKUc" },
  { lotNumber: "02", horseName: "DIRTY VOODOO", owner: "MARCUS FERRARI / HARAS FRANGE", pages: [p05.url, p06.url], videoUrl: "https://youtu.be/uJJ4geQ9dEs" },
  { lotNumber: "03", horseName: "POP ORANGE", owner: "RANCHO MARTENDAL", pages: [p07.url], videoUrl: "https://youtu.be/_9SC1Oz7z-0" },
  { lotNumber: "04", horseName: "GALLO GUNNERS", owner: "RANCHO MARTENDAL", pages: [p08.url], videoUrl: "https://youtu.be/D8jpf3Z6pJI" },
  { lotNumber: "05", horseName: "NN", owner: "HARAS SANTA FELICITÁ", pages: [p09.url], videoUrl: "https://youtu.be/DAivjmpTFOo" },
  { lotNumber: "06", horseName: "SPETACULO HOT GUNNER", owner: "RANCHO MARTENDAL", pages: [p10.url], videoUrl: "https://youtu.be/2Da8ffPqIfk" },
  { lotNumber: "07", horseName: "GALLO BEST GUN", owner: "RANCHO MARTENDAL", pages: [p11.url], videoUrl: "https://youtu.be/Yxt7-xoht0Q" },
  { lotNumber: "08", horseName: "QUEN BUCKS GUN", owner: "RANCHO MARTENDAL", pages: [p12.url], videoUrl: "https://youtu.be/928gLhhnuXc" },
  { lotNumber: "09", horseName: "CAT JAGUAR", owner: "RANCHO MARTENDAL", pages: [p13.url], videoUrl: null },
  { lotNumber: "10", horseName: "POESY GOTTA GUN", owner: "RANCHO MARTENDAL", pages: [p14.url], videoUrl: "https://youtu.be/UlorBaLuofE" },
  { lotNumber: "11", horseName: "SUIT GUNNERS", owner: "RANCHO MARTENDAL", pages: [p15.url], videoUrl: "https://youtu.be/yH1Quahv-CE" },
  { lotNumber: "12", horseName: "BEST GUN ZORREIRO", owner: "RANCHO MARTENDAL", pages: [p16.url], videoUrl: "https://youtu.be/ywEs0sqX0_c" },
  { lotNumber: "13", horseName: "GALLO STARBUCK", owner: "RANCHO MARTENDAL", pages: [p17.url], videoUrl: "https://youtu.be/WbXhYtqMbtY" },
  { lotNumber: "14", horseName: "SWEET JAGUAR ROXO", owner: "RANCHO MARTENDAL", pages: [p18.url], videoUrl: "https://youtu.be/0GsEUEOSBiY" },
  { lotNumber: "15", horseName: "REIN ROCK DUAL", owner: "RANCHO MARTENDAL", pages: [p19.url], videoUrl: "https://youtu.be/wpSTX4DOTNk" },
  { lotNumber: "16", horseName: "ORANGE GALLO GUNNER", owner: "RANCHO MARTENDAL", pages: [p20.url], videoUrl: "https://youtu.be/4efKdbw2MlE" },
  { lotNumber: "17", horseName: "PRINCESS FROM A STAR", owner: "RANCHO MARTENDAL", pages: [p21.url], videoUrl: null },
  { lotNumber: "18", horseName: "CAT STARLIGHT", owner: "RANCHO MARTENDAL", pages: [p22.url], videoUrl: "https://youtu.be/J18nl-bEZ-w" },
  { lotNumber: "19", horseName: "GALLO SPRING STEP", owner: "RANCHO MARTENDAL", pages: [p23.url], videoUrl: "https://youtu.be/at-VIoLbvvc" },
  { lotNumber: "20", horseName: "ONE QUEEN BUCKS TPC", owner: "RANCHO MARTENDAL", pages: [p24.url], videoUrl: "https://youtu.be/d3KrHXfqDSw" },
  { lotNumber: "21", horseName: "SWEET ZORREIRO", owner: "RANCHO MARTENDAL", pages: [p25.url], videoUrl: "https://youtu.be/RHd4q7SX7dc" },
  { lotNumber: "22", horseName: "CATCHEME GALLO", owner: "RANCHO MARTENDAL", pages: [p26.url], videoUrl: "https://youtu.be/Pb_p2Vn6XAg" },
  { lotNumber: "23", horseName: "ASUGAR GUNNERS", owner: "RANCHO MARTENDAL", pages: [p27.url], videoUrl: "https://youtu.be/UXb3XJA9BVc" },
  { lotNumber: "24", horseName: "POESY GUNNERS", owner: "RANCHO MARTENDAL", pages: [p28.url], videoUrl: "https://youtu.be/1DO1FVa6tFo" },
  { lotNumber: "25", horseName: "CHEX FRON SPARK", owner: "RANCHO MARTENDAL", pages: [p29.url], videoUrl: "https://youtu.be/gg5OIMzXrek" },
  { lotNumber: "26", horseName: "MISS SUN SHINE", owner: "RANCHO MARTENDAL", pages: [p30.url], videoUrl: "https://youtu.be/74LBk16thwA" },
  { lotNumber: "27", horseName: "LILY BETH DUAL", owner: "RANCHO MARTENDAL", pages: [p31.url], videoUrl: "https://youtu.be/jVteddPJskc" },
  { lotNumber: "28", horseName: "DUALMINIC STARBUCK", owner: "RANCHO MARTENDAL", pages: [p32.url], videoUrl: "https://youtu.be/R-yLI5WZCIM" },
  { lotNumber: "29", horseName: "CÁSSIA GUNNERS SPARK", owner: "RANCHO MARTENDAL", pages: [p33.url], videoUrl: "https://youtu.be/9u-x7f-khqk" },
  { lotNumber: "30", horseName: "CATGUN GALLO", owner: "RANCHO MARTENDAL", pages: [p34.url], videoUrl: "https://youtu.be/f_CO6Lb_X0M" },
  { lotNumber: "31", horseName: "ORANGE GUN", owner: "RANCHO MARTENDAL", pages: [p35.url], videoUrl: "https://youtu.be/SK6qN4li-hc" },
  { lotNumber: "32", horseName: "POESY WHIZ", owner: "RANCHO MARTENDAL", pages: [p36.url], videoUrl: "https://youtu.be/sp1CbgqECI4" },
  { lotNumber: "33", horseName: "GYPSY COUNTRY GUN", owner: "RANCHO MARTENDAL", pages: [p37.url], videoUrl: "https://youtu.be/v2HTbR9S2_s" },
  { lotNumber: "34", horseName: "REIN ROCK CIELO", owner: "RANCHO MARTENDAL", pages: [p38.url], videoUrl: "https://youtu.be/tTyoKPIvt1I" },
  { lotNumber: "35", horseName: "JDR CASSIA SPARK", owner: "RANCHO MARTENDAL", pages: [p39.url], videoUrl: "https://youtu.be/FMPrMXR3ZPs" },
  { lotNumber: "36", horseName: "SPOOK RUN SPOOKS", owner: "RANCHO MARTENDAL", pages: [p40.url], videoUrl: "https://youtu.be/jqoi3WgWTYo" },
  { lotNumber: "37", horseName: "CATCHEME GOTTA GUN", owner: "RANCHO MARTENDAL", pages: [p41.url], videoUrl: "https://youtu.be/_wrZYaljVCk" },
  { lotNumber: "38", horseName: "HOLLYWOOD BEST GUN", owner: "RANCHO MARTENDAL", pages: [p42.url], videoUrl: "https://youtu.be/OAUhPCY0e4w" },
  { lotNumber: "39", horseName: "ORANGE STARLIGHT", owner: "RANCHO MARTENDAL", pages: [p43.url], videoUrl: "https://youtu.be/EKCRoEGvCIE" },
  { lotNumber: "40", horseName: "KHALEESI", owner: "RANCHO MARTENDAL", pages: [p44.url], videoUrl: "https://youtu.be/8nVET_CFK_I" },
  { lotNumber: "41", horseName: "DOMINIQUE STARBUCK", owner: "RANCHO MARTENDAL", pages: [p45.url], videoUrl: "https://youtu.be/p6NPd277OXs" },
  { lotNumber: "42", horseName: "IZZY ZORREIRO FV", owner: "AGRO RIO RANCH", pages: [p46.url], videoUrl: "https://youtu.be/t1JDudhlX8Q" },
  { lotNumber: "43", horseName: "CAT PEPPY GRAY", owner: "RANCHO DAKOTA", pages: [p47.url], videoUrl: "https://youtu.be/HD65MIrKp6U" },
  { lotNumber: "44", horseName: "CASH LENA BADGER", owner: "CANAÃ AGROPECUÁRIA FAZENDA LIBERDADE", pages: [p48.url], videoUrl: "https://youtu.be/bCobfXPwKxU" },
  { lotNumber: "45", horseName: "LADY POP BELL FAFJ", owner: "RANCHO DURVAL FARIA", pages: [p49.url], videoUrl: "https://youtu.be/04ESISGcyRM" },
  { lotNumber: "46", horseName: "DOLITA DUNIT PATRON", owner: "CANAÃ AGROPECUÁRIA FAZENDA LIBERDADE", pages: [p50.url], videoUrl: "https://youtu.be/0fV_VxK0KjY" },
  { lotNumber: "47", horseName: "SLEEPING WRANGLER", owner: "AGRO RIO RANCH", pages: [p51.url], videoUrl: "https://youtu.be/Pk5XNhZuEPM" },
  { lotNumber: "48", horseName: "SKY TINY DUNIT", owner: "HARAS WG", pages: [p52.url], videoUrl: "https://youtu.be/1u6i8fG2gQc" },
  { lotNumber: "49", horseName: "NN.", owner: "JD RANCH", pages: [p53.url], videoUrl: null },
  { lotNumber: "51", horseName: "RED MONOPOLY DRT", owner: "RANCHO DAKOTA", pages: [p54.url], videoUrl: "https://youtu.be/cB85ji0hyUU" },
];
