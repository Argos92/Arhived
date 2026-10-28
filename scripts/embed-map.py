#!/usr/bin/env python3
"""Regenerate the offline SVG geography in family.html from the local GeoJSON."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def polygon_path(rings):
    result = []
    for ring in rings:
        points = []
        for index, (lon, lat, *_) in enumerate(ring):
            x, y = (lon + 180) * 4, (90 - lat) * 4
            points.append(f'{"M" if index == 0 else "L"}{x:.3f},{y:.3f}')
        result.append(''.join(points) + 'Z')
    return ''.join(result)


def main():
    data = json.loads((ROOT / 'assets/world-countries.geojson').read_text())
    paths = []
    for feature in data['features']:
        geometry = feature['geometry']
        if geometry['type'] == 'Polygon':
            path = polygon_path(geometry['coordinates'])
        elif geometry['type'] == 'MultiPolygon':
            path = ''.join(polygon_path(polygon) for polygon in geometry['coordinates'])
        else:
            raise ValueError(f'Unsupported geometry: {geometry["type"]}')
        paths.append(f'<path d="{path}"/>')
    html_path = ROOT / 'family.html'
    html, count = re.subn(
        r'<g id="land-layer" aria-hidden="true">.*?</g>',
        '<g id="land-layer" aria-hidden="true">' + ''.join(paths) + '</g>',
        html_path.read_text(), count=1, flags=re.DOTALL,
    )
    if count != 1:
        raise ValueError('Expected one land-layer container in family.html')
    html_path.write_text(html)
    print(f'Embedded {len(paths)} country geometries into family.html')


if __name__ == '__main__':
    main()
