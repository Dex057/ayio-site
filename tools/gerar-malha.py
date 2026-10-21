# -*- coding: utf-8 -*-
"""Gera a malha de quadras da seção "A base" do Avalora (produtos/avalora.html).
Troque a semente para um traçado diferente; o --d de cada quadra é o atraso
com que ela acende quando a varredura passa.

    python tools/gerar-malha.py > quadras.svg   # cole dentro de <g class="city__blocks">
"""
import random
random.seed(7)


W, H = 1200, 520
SWEEP = 4.2  # segundos que a varredura leva para cruzar a malha

def split(x, y, w, h, d, out):
    small = w < 44 or h < 38
    if small or d > 11 or (d >= 5 and random.random() < .14):
        out.append((x, y, w, h)); return
    r = random.uniform(.36, .64)
    if w > h:
        split(x, y, w*r, h, d+1, out); split(x+w*r, y, w*(1-r), h, d+1, out)
    else:
        split(x, y, w, h*r, d+1, out); split(x, y+h*r, w, h*(1-r), d+1, out)

raw = []
split(-90, -70, W+180, H+140, 0, raw)

blocos = []
for x, y, w, h in raw:
    if random.random() < .06:          # praças e vazios
        continue
    g = random.uniform(2.2, 5)          # largura da rua
    bx, by, bw, bh = x+g, y+g, w-2*g, h-2*g
    if bw < 9 or bh < 8:
        continue
    cx = max(0, min(1, (bx+bw/2)/W))
    blocos.append((round(bx,1), round(by,1), round(bw,1), round(bh,1),
                   round(cx*SWEEP, 2), round(random.uniform(.55, 1), 2)))

print(f'<!-- {len(blocos)} quadras -->')
for bx, by, bw, bh, d, o in blocos:
    print(f'<rect x="{bx}" y="{by}" width="{bw}" height="{bh}" rx="2" style="--d:{d}s;--o:{o}"/>')
