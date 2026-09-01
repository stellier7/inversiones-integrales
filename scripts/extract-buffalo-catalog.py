#!/usr/bin/env python3
"""Build buffalo-products.json from catalog page transcriptions."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'scripts' / 'extracted' / 'buffalo-products.json'

IMG = 'catalog/products'


def clean_desc(text):
    text = re.sub(r'\s+', ' ', text.strip())
    return text


def title_case_desc(text):
    """Make catalog descriptions easier to scan in the UI."""
    text = clean_desc(text)
  # Keep existing ALL CAPS tokens but add spaces in glued words
    text = re.sub(r'([a-z])([A-Z])', r'\1 \2', text)
    text = re.sub(r'([A-Z]{2,})([A-Z][a-z])', r'\1 \2', text)
    return text


def parse_medida(desc: str, code: str) -> str:
    text = clean_desc(desc).upper()
    m = re.search(r'(\d+(?:-\d+/\d+)?")\s*X\s*(\d+)', text)
    if m:
        return f'{m.group(1)}×{m.group(2)}°'
    m = re.search(r'(\d+(?:-\d+/\d+)?")', text)
    if m:
        return m.group(1)
    m = re.search(r'(\d+(?:\.\d+)?)\s*X\s*(\d+(?:\.\d+)?)\s*MM', text)
    if m:
        return f'{m.group(1)}×{m.group(2)} mm'
    m = re.search(r'(\d+)\s*MM\b', text)
    if m:
        return f'{m.group(1)} mm'
    m = re.search(r'(\d+)\s*PIES', text)
    if m:
        return f'{m.group(1)} pies'
    if code.startswith('TBN'):
        return code.replace('TBN-', '#').replace('X', '×')
    if code.startswith('ESP'):
        return code.replace('ESP-', '')
    return code


def family_name(desc: str) -> str:
    text = title_case_desc(desc)
    text = re.sub(r'\s*BUFFALO\s*$', '', text, flags=re.I)
    text = re.sub(r'\s+\d+(?:-\d+/\d+)?".*$', '', text)
    text = re.sub(r'\s+\d+(?:\.\d+)?\s*X\s*\d+.*$', '', text, flags=re.I)
    return text.strip() or title_case_desc(desc)


def page_products(page_image, group_id, group_label, items, category_key=None):
    rows = []
    for code, desc in items:
        description = clean_desc(desc)
        rows.append({
            'code': code,
            'nombre': family_name(desc),
            'description': description,
            'medida': parse_medida(description, code),
            'image': f'{IMG}/{page_image}',
            'page_image': page_image,
            'category_key': category_key,
            'group_id': group_id,
            'group_label': group_label,
        })
    return rows


def manual_products(category_key, group_id, group_label, items):
    rows = []
    for item in items:
        code, nombre, image = item[:3]
        chip1 = item[3] if len(item) > 3 else ''
        chip2 = item[4] if len(item) > 4 else ''
        chip3 = item[5] if len(item) > 5 else ''
        rows.append({
            'code': code,
            'nombre': nombre,
            'description': nombre,
            'medida': chip1 or parse_medida(nombre, code),
            'image': f'{IMG}/{image}',
            'page_image': '',
            'category_key': category_key,
            'group_id': group_id,
            'group_label': group_label,
            'chip1': chip1,
            'chip2': chip2,
            'chip3': chip3,
        })
    return rows


PVC_DREN = 'pvc-drenaje'
PVC_PRES = 'pvc-presion'
PVC_VAL = 'pvc-valvulas'
CPVC = 'cpvc'
FORJAS = 'forjas'
HERRAJES = 'herrajes-porton'
TORNILLOS = 'tornillos'
ACCESORIOS = 'accesorios'


def build():
    products = []

    products += page_products(
        'pvc/IMG_0477.jpeg', 'dwv-codos', 'Codos DWV',
        [
            ('5235B', 'CODO DWV DRENAJE INYECTADO 2"X45'),
            ('5239B', 'CODO DWV DRENAJE INYECTADO 2"X90'),
            ('5236B', 'CODO DWV DRENAJE INYECTADO 3"X45'),
            ('5240B', 'CODO DWV DRENAJE INYECTADO 3"X90'),
            ('5237B', 'CODO DWV DRENAJE INYECTADO 4"X45'),
            ('5241B', 'CODO DWV DRENAJE INYECTADO 4"X90'),
            ('5242B', 'CODO DWV DRENAJE INYECTADO 6"X90'),
            ('5238B', 'CODO PVC INYECTADO 4"X6" BUFFALO'),
        ],
        PVC_DREN,
    )
    products += page_products(
        'pvc/IMG_0477.jpeg', 'dwv-tees', 'Tees DWV',
        [
            ('1863B', 'TEE DWV DRENAJE INYECTADA 1-1/2"'),
            ('5247B', 'TEE DWV DRENAJE INYECTADA 2"'),
            ('5248B', 'TEE DWV DRENAJE INYECTADA 3"'),
            ('5245B', 'TEE DWV DRENAJE INYECTADA 4"'),
            ('5246B', 'TEE DWV DRENAJE INYECTADA 6"'),
        ],
        PVC_DREN,
    )
    products += page_products(
        'pvc/IMG_0477.jpeg', 'dwv-yees', 'Yees DWV',
        [
            ('5243B', 'YEE DWV DRENAJE INYECTADA 2"'),
            ('5244B', 'YEE DWV DRENAJE INYECTADA 3"'),
            ('5249B', 'YEE DWV DRENAJE INYECTADA 4"'),
            ('4946B', 'YEE PVC INYECTADA 1-1/2" BUFFALO'),
            ('5250B', 'YEE PVC INYECTADA 6"X6" BUFFALO'),
        ],
        PVC_DREN,
    )

    products += page_products(
        'pvc/IMG_0478.jpeg', 'bujes-presion', 'Bujes reductores',
        [
            ('5165B', 'REDUCCION LISA 1"X3/4" BUJE BUFFALO'),
            ('5170B', 'REDUCCION LISA 1-1/2"X3/4" BUJE BUFFALO'),
            ('5167B', 'REDUCCION LISA 1-1/4"X3/4" BUJE BUFFALO'),
            ('5168B', 'REDUCCION LISA 1-1/4"X1" BUJE BUFFALO'),
            ('5174B', 'REDUCCION LISA 2"X3/4" BUJE BUFFALO'),
            ('5172B', 'REDUCCION LISA PVC 1-1/2"X1-1/4" BUJE BUFFALO'),
            ('5163B', 'REDUCCION LISA PVC PRESION 3/4"X1/2" BUJE BUFFALO'),
            ('5164B', 'BUJE REDUCTOR PVC 1" X 1/2"'),
            ('5171B', 'BUJE REDUCTOR PVC 1-1/2"X1"'),
            ('5169B', 'BUJE REDUCTOR PVC 1-1/2"X1/2"'),
            ('5166B', 'BUJE REDUCTOR PVC 1-1/4"X1"'),
            ('5175B', 'BUJE REDUCTOR PVC 2"X1"'),
            ('5173B', 'BUJE REDUCTOR PVC 2"X1/2"'),
            ('5177B', 'BUJE REDUCTOR PVC 2"X1-1/2"'),
            ('5176B', 'BUJE REDUCTOR PVC 2"X1-1/4"'),
            ('5178B', 'BUJE REDUCTOR PVC 3"X2"'),
            ('5179B', 'BUJE REDUCTOR PVC 4"X2"'),
            ('5180B', 'BUJE REDUCTOR PVC 4"X3"'),
        ],
        PVC_PRES,
    )

    products += page_products(
        'pvc/IMG_0479.jpeg', 'abrazaderas', 'Abrazaderas',
        [
            ('5219B', 'ABRAZADERA PVC SENCILLA 1/2"'),
            ('5189B', 'ABRAZADERA PVC SENCILLA 3/4"'),
            ('5127B', 'ABRAZADERA PVC SENCILLA 1"'),
            ('5128B', 'ABRAZADERA PVC SENCILLA 1-1/4"'),
            ('5144B', 'ABRAZADERA PVC SENCILLA 1-1/2" BUFFALO'),
            ('5145B', 'ABRAZADERA PVC SENCILLA 2"'),
            ('5146B', 'ABRAZADERA PVC SENCILLA 3"'),
            ('5147B', 'ABRAZADERA PVC SENCILLA 4"'),
        ],
        PVC_PRES,
    )
    products += page_products(
        'pvc/IMG_0479.jpeg', 'adaptadores-macho', 'Adaptadores macho',
        [
            ('5155B', 'ADAPTADOR MACHO PVC 1/2"'),
            ('5156B', 'ADAPTADOR MACHO PVC 3/4" BUFFALO'),
            ('5157B', 'ADAPTADOR MACHO PVC 1"'),
            ('5158B', 'ADAPTADOR MACHO PVC 1-1/4" BUFFALO'),
            ('5159B', 'ADAPTADOR MACHO PVC 1-1/2"'),
            ('5160B', 'ADAPTADOR MACHO PVC 2"'),
            ('5161B', 'ADAPTADOR MACHO PVC 3"'),
            ('5162B', 'ADAPTADOR MACHO PVC 4"'),
        ],
        PVC_PRES,
    )

    products += page_products(
        'pvc/IMG_0480.jpeg', 'adaptadores-hembra', 'Adaptadores hembra',
        [
            ('5148B', 'ADAPTADOR HEMBRA PVC PRESION 1/2" BUFFALO'),
            ('5149B', 'ADAPTADOR HEMBRA PVC PRESION 3/4" BUFFALO'),
            ('5150B', 'ADAPTADOR HEMBRA PVC 1"'),
            ('1758B', 'ADAPTADOR HEMBRA PVC 1-1/4"'),
            ('5151B', 'ADAPTADOR HEMBRA PVC 1-1/2"'),
            ('5152B', 'ADAPTADOR HEMBRA PVC 2"'),
            ('5153B', 'ADAPTADOR HEMBRA PVC 3"'),
            ('5154B', 'ADAPTADOR HEMBRA PVC 4"'),
        ],
        PVC_PRES,
    )
    products += page_products(
        'pvc/IMG_0480.jpeg', 'codos-presion', 'Codos presión',
        [
            ('5190B', 'CODO PVC 1/2"X90'),
            ('5181B', 'CODO PVC 1/2"X45'),
            ('5182B', 'CODO PVC PRESION 45 X 3/4" BUFFALO'),
            ('5191B', 'CODO PVC PRESION 90 X 3/4" BUFFALO'),
            ('5183B', 'CODO PVC PRESION 45 X 1" BUFFALO'),
            ('5193B', 'CODO PVC 1-1/4"X90'),
            ('5184B', 'CODO PVC 1-1/4" X45'),
            ('5185B', 'CODO PVC 1-1/2" X45'),
            ('5194B', 'CODO PVC 1-1/2"X90'),
            ('5195B', 'CODO PVC 2"X90'),
            ('5186B', 'CODO PVC 2"X45'),
            ('5196B', 'CODO PVC 3"X90'),
            ('5187B', 'CODO PVC 3"X45'),
            ('5197B', 'CODO PVC 4"X90'),
            ('5188B', 'CODO PVC 4"X45'),
        ],
        PVC_PRES,
    )

    products += page_products(
        'pvc/IMG_0481.jpeg', 'tees-presion', 'Tees presión',
        [
            ('5202B', 'TEE PVC 1-1/2"'),
            ('5200B', 'TEE PVC 1"'),
            ('5198B', 'TEE PVC 1/2"'),
            ('5201B', 'TEE PVC 1-1/4"'),
            ('5203B', 'TEE PVC 2"'),
            ('5204B', 'TEE PVC 3"'),
            ('5205B', 'TEE PVC 4"'),
            ('5199B', 'TEE PVC LISA PRESION 3/4" BUFFALO'),
        ],
        PVC_PRES,
    )
    products += page_products(
        'pvc/IMG_0481.jpeg', 'tapones', 'Tapones',
        [
            ('5206B', 'TAPON HEMBRA LISO 1/2" BUFFALO'),
            ('5207B', 'TAPON HEMBRA LISO 3/4" BUFFALO'),
            ('5208B', 'TAPON HEMBRA LISO 1-1/4" BUFFALO'),
            ('5209B', 'TAPON HEMBRA LISO 1-1/2" BUFFALO'),
            ('5210B', 'TAPON PVC 2"'),
            ('5211B', 'TAPON PVC 3"'),
            ('5212B', 'TAPON PVC 4"'),
        ],
        PVC_PRES,
    )
    products += page_products(
        'pvc/IMG_0481.jpeg', 'uniones-lisas', 'Uniones lisas',
        [
            ('5216B', 'UNION PVC LISA 1-1/4"'),
            ('5215B', 'UNION PVC LISA 1"'),
            ('5213B', 'UNION PVC LISA 1/2"'),
            ('5217B', 'UNION PVC LISA 1-1/2"'),
            ('5218B', 'UNION PVC LISA 2"'),
            ('5220B', 'UNION PVC LISA 3"'),
            ('5221B', 'UNION PVC LISA 4"'),
            ('5214B', 'UNION LISA PVC DE 3/4" BUFFALO'),
        ],
        PVC_PRES,
    )

    products += page_products(
        'pvc/IMG_0482.jpeg', 'bujes-dwv', 'Bujes DWV',
        [
            ('5232B', 'BUJE DWV REDUCTOR DRENAJE INYECTADO 3"X2"'),
            ('5233B', 'BUJE DWV REDUCTOR DRENAJE INYECTADO 4"X2"'),
            ('5234B', 'BUJE DWV REDUCTOR DRENAJE INYECTADO 4"X3"'),
        ],
        PVC_DREN,
    )
    products += page_products(
        'pvc/IMG_0482.jpeg', 'uniones-drenaje', 'Uniones drenaje',
        [
            ('4947B', 'UNION DRENAJE INYECTADA 2" BUFFALO'),
            ('4949B', 'UNION DWV DRENAJE INYECTADA 4"'),
        ],
        PVC_DREN,
    )
    products += page_products(
        'pvc/IMG_0482.jpeg', 'uniones-compresion', 'Uniones compresión',
        [
            ('5229B', 'UNION PVC DE COMPRESION 1-1/2" BUFFALO'),
            ('5227B', 'UNION PVC COMPRESION 1" BUFFALO'),
            ('5225B', 'UNION PVC COMPRESION 1/2" BUFFALO'),
            ('5228B', 'UNION PVC COMPRESION 1-1/4" BUFFALO'),
            ('5230B', 'UNION PVC COMPRESION 2" BUFFALO'),
            ('5231B', 'UNION PVC COMPRESION 3" BUFFALO'),
            ('5226B', 'UNION PVC COMPRESION 3/4" BUFFALO'),
            ('7737B', 'UNION PVC COMPRESION 4" BUFFALO'),
            ('7738B', 'UNION PVC COMPRESION 6" BUFFALO'),
        ],
        PVC_PRES,
    )
    products += page_products(
        'pvc/IMG_0482.jpeg', 'uniones-universales', 'Uniones universales',
        [
            ('5224B', 'UNION PVC UNIVERSAL 1" BUFFALO'),
            ('5222B', 'UNION PVC UNIVERSAL 1/2" BUFFALO'),
            ('1881B', 'UNION PVC UNIVERSAL 1-1/2" BUFFALO'),
            ('1882B', 'UNION PVC UNIVERSAL 1-1/4" BUFFALO'),
            ('1883B', 'UNION PVC UNIVERSAL 2"'),
            ('8782B', 'UNION PVC UNIVERSAL 3" BUFFALO'),
            ('5223B', 'UNION PVC UNIVERSAL 3/4" BUFFALO'),
            ('8974B', 'UNION PVC UNIVERSAL 4" BUFFALO'),
        ],
        PVC_PRES,
    )

    products += page_products(
        'pvc/IMG_0483.jpeg', 'valvulas-bola', 'Válvulas de bola',
        [
            ('3010B', 'VALVULA COMPACTA PVC 1"'),
            ('3008B', 'VALVULA COMPACTA PVC 1/2"'),
            ('3011B', 'VALVULA COMPACTA PVC 1-1/2"'),
            ('3012B', 'VALVULA COMPACTA PVC 2"'),
            ('3015B', 'VALVULA COMPACTA PVC 3"'),
            ('3038B', 'VALVULA LISA PVC D/BOLA PVC 6" BUFFALO'),
            ('7302B', 'VALVULA PVC BOLA 3/4" BUFFALO'),
            ('5976B', 'VALVULA PVC D/BOLA 1-1/4" BUFFALO'),
            ('7864B', 'VALVULA PVC D/BOLA 4" BUFFALO'),
        ],
        PVC_VAL,
    )
    products += page_products(
        'pvc/IMG_0483.jpeg', 'trampas-sifones', 'Trampas y sifones',
        [
            ('1838B', 'TRAMPA/SIFON DRENAJE INYECTADO 1-1/2" BUFFALO'),
            ('5251B', 'TRAMPA/SIFON PVC INYECTADA 2" BUFFALO'),
        ],
        PVC_VAL,
    )
    products += page_products(
        'pvc/IMG_0483.jpeg', 'accesorios-cpvc', 'Accesorios CPVC',
        [
            ('1755B', 'ADAPTADOR CPVC HEMBRA 3/4" BUFFALO'),
            ('0954B', 'ADAPTADOR CPVC MACHO 1/2" BUFFALO'),
            ('1763B', 'ADAPTADOR CPVC MACHO 3/4" BUFFALO'),
            ('8901B', 'ADAPTADOR HEMBRA CPVC 1/2" BUFFALO'),
            ('0927B', 'CODO CPVC 45 X 1/2" BUFFALO'),
            ('0928B', 'CODO CPVC 45 X 3/4" BUFFALO'),
            ('0926B', 'CODO CPVC 90" X 3/4" BUFFALO'),
            ('4755B', 'CODO CPVC 90 X 1/2" BUFFALO'),
            ('5502B', 'REDUCCION/BUJE CPVC 3/4"X1/2" BUFFALO'),
            ('1861B', 'TAPON LISO CPVC 1/2" BUFFALO'),
            ('0929B', 'TAPON LISO CPVC 3/4" BUFFALO'),
            ('0930B', 'TEE CPVC 1/2" BUFFALO'),
            ('0931B', 'TEE CPVC 3/4" BUFFALO'),
            ('4972B', 'UNION CPVC 1/2" BUFFALO'),
            ('0932B', 'UNION CPVC 3/4" BUFFALO'),
            ('1899B', 'VALVULA CPVC 1/2" BUFFALO'),
            ('1117B', 'VALVULA CPVC 3/4" BUFFALO'),
        ],
        CPVC,
    )

    forjas_pages = [
        ('forjas/IMG_0501.jpeg', 'forja-barras', 'Barras y paneles', [
            ('5909H', 'FORJA CARACOL INDIA 88/H/3 75X130MM 12X6MM'),
            ('5924H', 'FORJA 48/2 BARRA 12MM 55X900MM'),
            ('5925H', 'FORJA 64/F/4 BARRA 12MM 900MM'),
            ('5926H', 'FORJA 50/8 BARRA 12MM 140X900MM'),
            ('5927H', 'FORJA 48/1 BARRA 12MM 55X900MM'),
            ('5928H', 'FORJA 50/7 BARRA 12MM 140X900MM'),
            ('1989H', 'PANEL 0688 900X160MM MES FLOR A AMBOS LADOS'),
            ('9065H', 'FORJA BARRA INDIA 49/3 12MM 180X900MM'),
            ('5923H', 'FORJA 497/2/C BARRA 12MM H 1000MM'),
        ]),
        ('forjas/IMG_0502.jpeg', 'forja-paneles', 'Paneles decorativos', [
            ('1983H', 'PANEL 74/2 360X120MM W12MM X T6MM'),
            ('1984H', 'PANEL 74/14 290X120MM W12MM X T6MM'),
            ('1986H', 'PANEL 1671/3 870X350MM W12MM X T6MM'),
            ('1987H', 'PANEL 1647/16 10X440MM W12MM X T6MM'),
            ('1988H', 'PANEL 36/12 50X220MM W12MM X T6MM'),
            ('6024H', 'FORJA #36/2 CARACOL INDIA 12X6MM 380X230MM'),
            ('7601H', 'FORJA ROSETA INDIA 23/1 10X5X250MM'),
            ('9985H', 'CARACOL FORJA INDIA 33/2 250MM 12MM X 6MM'),
            ('5892H', 'FORJA 80/A/1 CARACOL INDIA 110X270MM 12X6MM'),
            ('6821H', 'FORJA 88/H/4 COLOCHA GRANDE 160MM X 75MM'),
        ]),
        ('forjas/IMG_0503.jpeg', 'forja-flores', 'Flores y mariposas', [
            ('6486H', 'FORJA 159/3 DECORATIVA CANASTA OVALADA'),
            ('8010H', 'FORJA 644/5 INDIA FLOR RHINOCERONTE C/ESFERA 90MM'),
            ('8011H', 'FORJA 140/1/3 FLOR ROSA'),
            ('8009H', 'FORJA 697/3 INDIA FLOR C/ESFERA'),
            ('6012H', 'FORJA 3A/22 FLOR D/HIERRO P/VERJA'),
            ('3307H', 'FORJA 116/A/4 FLOR MARGARITA PEQ 8 PETALO'),
            ('8012H', 'FORJA 137/10 MARIPOSA 175X125MM'),
            ('0304H', 'FORJA 26/C/1 CON FLOR CENTRO (250-19B08)'),
            ('1980H', 'PANEL 17/18 X 8MM 250MM'),
            ('1982H', 'PANEL 74/20 220X108MM W12MM X T6MM'),
        ]),
        ('forjas/IMG_0504.jpeg', 'forja-elementos', 'Elementos y uniones', [
            ('1975H', 'FORJA 154/2 HOLE 12.5MM 150X30MM'),
            ('1978H', 'FORJA 128/17 HOLE 12.5MM 39X40MM'),
            ('7884H', 'FORJA 155/3 DECORATIVA INDIA UNION 12.5MM'),
            ('9194H', 'FORJA 155/2 DECORATIVA INDIA UNION 12MM 65'),
            ('1974H', 'FORJA 126/F/1 HOLE 12MM 65 X 40MM'),
            ('1977H', 'FORJA 1393/19 HOLE 14.2MM 19MM X 33MM'),
            ('1979H', 'FORJA 155/4 HOLE 12.5MM 20 X 30MM'),
            ('5829H', 'TERMINAL 128/35 50X90MM'),
            ('1976H', 'FORJA 746/1 HOLE 12.5MM 45 X 40MM'),
            ('1990H', 'FORJA 158/B/1 CANASTA/PIÑA 12MM 55X130MM'),
        ]),
        ('forjas/IMG_0506.jpeg', 'forja-hojas', 'Esferas y hojas', [
            ('8014H', 'FORJA MESO 110 ESFERA 40MM'),
            ('8015H', 'FORJA MESO 110 ESFERA 50MM'),
            ('1245H', 'FORJA 116/F/3 ESFERA INDIA SOLIDA 30MM'),
            ('1246H', 'FORJA 116/F/1 ESFERA INDIA SOLIDA 20MM'),
            ('5903H', 'FORJA 136/2 HOJA DERECHA 110X40MM T2.5MM'),
            ('6484H', 'FORJA 136/1 HOJA IZQUIERDA 40X110MM'),
            ('1965H', 'FORJA 136/4 HOJA ANCHA IZQUIERDA 75X60MM'),
            ('6485H', 'FORJA 136/3 HOJA ANCHA DERECHA 75X60MM'),
            ('8016H', 'FORJA 662/6 HOJA 150X250MM 16X6MM DERE'),
            ('8013H', 'FORJA 662/5 HOJA 150X250MM 16X6MM IZQUIE'),
        ]),
        ('forjas/IMG_0507.jpeg', 'forja-lanzas', 'Lanzas y puntas', [
            ('8020H', 'FORJA 180-1207 HOJA 116 X 50 X 3 MM'),
            ('7351H', 'FORJA 125/1 DECORATIVA LANZA 35MM H 125MM'),
            ('7349H', 'FORJA 124/1 DECORATIVA LANZA 12X125MM'),
            ('7734H', 'PUNTA LU-2/08AD HIERRO P/VERJA H.115MM L5'),
            ('7733H', 'FORJA 0020 DECORATIVA LANZA MEC 14.5MM 100MM X 38MM'),
            ('1954H', 'FORJA 726/5 LANZA 13MM 140MM X 48MM'),
            ('2002H', 'FORJA 3A/05 LANZA'),
            ('1971H', 'FORJA 727/9 LANZA 25MM 120MM X W70MM'),
            ('1972H', 'FORJA 128/6 HOLE 12.5MM 65X40MM'),
            ('1969H', 'FORJA 747/9 HOLE 13.5MM 115 X 40MM'),
        ]),
    ]
    for page, gid, glabel, items in forjas_pages:
        products += page_products(page, gid, glabel, items, FORJAS)

    products += page_products(
        'forjas/IMG_0505.jpeg', 'rodillos', 'Rodillos',
        [
            ('1992H', 'RODO 17 60MM'),
            ('1993H', 'RODO 20 S/BASE C/PERNO 80MM'),
            ('1991H', 'RODO 15 S/BASE C/PERNO 50MM'),
            ('1994H', 'RODO 20 50MM DOUBLE BEARING'),
            ('1995H', 'RODO 23 80MM DOUBLE BEARING'),
            ('1996H', 'RODO 15 C/BASE 50MM'),
            ('1997H', 'RODO 20 C/BASE 80MM'),
            ('2003H', 'RODO DL55-A AEREO 55 X 43MM FOUR WHEEL'),
        ],
        HERRAJES,
    )
    products += page_products(
        'forjas/IMG_0505.jpeg', 'rieles', 'Rieles de portón',
        [
            ('1998H', 'RIEL TIPO U P/PORTON DE 8 PIES BUFFALO'),
            ('1999H', 'RIEL TIPO U P/PORTON DE 10 PIES BUFFALO'),
            ('2000H', 'RIEL TIPO U P/PORTON DE 12 PIES BUFFALO'),
            ('2001H', 'RIEL TIPO U DE 20 PIES'),
        ],
        HERRAJES,
    )

    products += manual_products(
        TORNILLOS, 'techo-punta-broca', 'Techo punta broca',
        [
            ('TBN-14X2', 'Tornillo para techo punta broca #14×2"', 'tornillos/techo-14x2-250.jpeg', '#14×2"', '250 pzs', 'Punta broca'),
            ('TBN-14X3', 'Tornillo para techo punta broca #14×3"', 'tornillos/techo-14x3-200.jpeg', '#14×3"', '200 pzs', 'Punta broca'),
            ('TBN-BOX', 'Tornillo para techo punta broca Buffalo', 'tornillos/techo-broca-open.jpeg', 'Hexagonal', 'Con arandela', 'Buffalo'),
        ],
    )
    products += manual_products(
        ACCESORIOS, 'esponjas', 'Esponjas multi-uso',
        [
            ('ESP-160', 'Esponja Multi-Uso 3W Plus', 'accesorios/esponja-3w-160.jpeg', '160×100×60 mm', 'Buffalo Plus 3W', 'Pulido'),
            ('ESP-190', 'Esponja Multi-Uso 3W Plus', 'accesorios/esponja-3w-190.jpeg', '190×109×50 mm', 'Buffalo Plus 3W', 'Pulido'),
        ],
    )

    for p in products:
        if 'category_key' not in p or not p['category_key']:
            p['category_key'] = FORJAS

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(products, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'Wrote {len(products)} products to {OUT.relative_to(ROOT)}')


if __name__ == '__main__':
    build()
