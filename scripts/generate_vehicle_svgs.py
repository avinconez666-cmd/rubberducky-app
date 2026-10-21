from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "mobile-app" / "assets" / "garage"
VEH = ROOT / "vehicles"
ACC = ROOT / "accessories"
VEH.mkdir(parents=True, exist_ok=True)
ACC.mkdir(parents=True, exist_ok=True)


def svg(name, body, accent="#32E6D3", viewbox="0 0 360 180"):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{viewbox}" role="img" aria-labelledby="title desc">
  <title id="title">{name}</title>
  <desc id="desc">Scalable Rubberducky garage vehicle asset</desc>
  <defs>
    <linearGradient id="paint" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{accent}"/><stop offset="1" stop-color="#17202c"/></linearGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  {body}
</svg>\n'''

wheel = '<circle cx="92" cy="132" r="23" fill="#171A21"/><circle cx="92" cy="132" r="12" fill="#D8E4E8"/><circle cx="268" cy="132" r="23" fill="#171A21"/><circle cx="268" cy="132" r="12" fill="#D8E4E8"/>'

vehicles = {
    "compact-car": svg("Compact Car", f'''<ellipse cx="180" cy="157" rx="132" ry="8" fill="#000" opacity=".22"/><path d="M36 116h286a16 16 0 0 0 0-32h-22L252 48c-10-11-26-17-42-17h-64c-21 0-41 9-53 26L74 84H52a16 16 0 0 0-16 16z" fill="url(#paint)"/><path d="M105 79 122 53c7-10 18-15 31-15h43c14 0 26 5 36 15l17 26z" fill="#B7DCEA" opacity=".9"/><circle cx="92" cy="128" r="22" fill="#171A21"/><circle cx="92" cy="128" r="11" fill="#D8E4E8"/><circle cx="268" cy="128" r="22" fill="#171A21"/><circle cx="268" cy="128" r="11" fill="#D8E4E8"/><rect x="286" y="95" width="25" height="10" rx="5" fill="#FFF6D0"/>''', "#32E6D3"),
    "adventure-van": svg("Adventure Van", f'''<ellipse cx="180" cy="157" rx="138" ry="8" fill="#000" opacity=".22"/><rect x="34" y="42" width="292" height="88" rx="18" fill="url(#paint)"/><path d="M252 54 313 80v40h-61z" fill="#B7DCEA" opacity=".9"/><rect x="56" y="56" width="48" height="31" rx="5" fill="#B7DCEA" opacity=".9"/><rect x="115" y="56" width="48" height="31" rx="5" fill="#B7DCEA" opacity=".9"/><rect x="174" y="56" width="48" height="31" rx="5" fill="#B7DCEA" opacity=".9"/>{wheel}<rect x="75" y="32" width="210" height="5" rx="2" fill="#D8E4E8"/>''', "#FF6F61"),
    "scooter": svg("Electric Scooter", f'''<ellipse cx="180" cy="157" rx="116" ry="7" fill="#000" opacity=".22"/><circle cx="92" cy="132" r="19" fill="#171A21"/><circle cx="92" cy="132" r="9" fill="#D8E4E8"/><circle cx="262" cy="132" r="19" fill="#171A21"/><circle cx="262" cy="132" r="9" fill="#D8E4E8"/><path d="M92 125h122l35-61" fill="none" stroke="url(#paint)" stroke-width="12" stroke-linecap="round"/><path d="M238 64 262 38" stroke="#D8E4E8" stroke-width="6" stroke-linecap="round"/><path d="M214 62h32" stroke="#D8E4E8" stroke-width="5" stroke-linecap="round"/><rect x="120" y="116" width="104" height="12" rx="6" fill="#8C6CFF"/>''', "#8C6CFF"),
    "monster-truck": svg("Monster Truck", f'''<ellipse cx="180" cy="163" rx="148" ry="9" fill="#000" opacity=".22"/><rect x="42" y="68" width="272" height="66" rx="18" fill="url(#paint)"/><path d="M78 68 108 30h90l42 38z" fill="url(#paint)"/><path d="M112 61 128 39h63l25 22z" fill="#B7DCEA" opacity=".9"/>{wheel}<circle cx="78" cy="135" r="30" fill="#171A21"/><circle cx="78" cy="135" r="14" fill="#B9F227"/><circle cx="288" cy="135" r="30" fill="#171A21"/><circle cx="288" cy="135" r="14" fill="#B9F227"/><rect x="260" y="85" width="42" height="13" rx="6" fill="#FFF6D0"/>''', "#287BFF"),
    "sci-fi-hover-coupe": svg("Sci-Fi Hover Coupe", '''<ellipse cx="180" cy="151" rx="132" ry="7" fill="#32E6D3" opacity=".18" filter="url(#glow)"/><path d="M34 112c32-21 52-39 88-47l43-9c34-7 77 3 104 25l48 31c9 6 5 17-7 17H46c-16 0-22-10-12-17z" fill="url(#paint)"/><path d="M115 67 149 48c27-14 70-13 100 3l19 18z" fill="#A9E9F4" opacity=".9"/><path d="M75 128h44M242 128h42" stroke="#32E6D3" stroke-width="8" stroke-linecap="round" filter="url(#glow)"/><circle cx="89" cy="128" r="13" fill="#17202c" stroke="#32E6D3" stroke-width="5"/><circle cx="271" cy="128" r="13" fill="#17202c" stroke="#32E6D3" stroke-width="5"/>''', "#32E6D3"),
    "sci-fi-recon-rover": svg("Sci-Fi Recon Rover", '''<ellipse cx="180" cy="160" rx="144" ry="8" fill="#000" opacity=".22"/><rect x="35" y="66" width="290" height="68" rx="20" fill="url(#paint)"/><path d="M83 66 112 32h102l37 34z" fill="#202633"/><path d="M130 53h67" stroke="#B9F227" stroke-width="7" stroke-linecap="round"/><circle cx="180" cy="32" r="13" fill="#B9F227"/><circle cx="83" cy="136" r="31" fill="#171A21" stroke="#B9F227" stroke-width="7"/><circle cx="277" cy="136" r="31" fill="#171A21" stroke="#B9F227" stroke-width="7"/><rect x="302" y="88" width="17" height="12" rx="4" fill="#FFF6D0"/>''', "#B9F227"),
    "sci-fi-orbital-bike": svg("Sci-Fi Orbital Bike", '''<ellipse cx="180" cy="153" rx="120" ry="7" fill="#8C6CFF" opacity=".2" filter="url(#glow)"/><circle cx="96" cy="129" r="25" fill="none" stroke="#32E6D3" stroke-width="8" filter="url(#glow)"/><circle cx="260" cy="129" r="25" fill="none" stroke="#32E6D3" stroke-width="8" filter="url(#glow)"/><path d="M96 129 151 77h66l43 52M151 77l34 52M185 129l32-52" fill="none" stroke="url(#paint)" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/><path d="M145 80c19-24 57-25 77-3l-5 26h-72z" fill="#8C6CFF"/><path d="M211 75h35" stroke="#D8E4E8" stroke-width="5" stroke-linecap="round"/>''', "#8C6CFF"),
    "sci-fi-utility-shuttle": svg("Sci-Fi Utility Shuttle", '''<ellipse cx="180" cy="156" rx="140" ry="8" fill="#000" opacity=".22"/><path d="M32 114 67 74l77-31h83l89 45c13 7 8 25-7 25H45c-14 0-21-9-13-19z" fill="url(#paint)"/><path d="M112 68 150 50h67l33 20z" fill="#B7DCEA" opacity=".9"/><path d="M84 94h185" stroke="#FFD447" stroke-width="8" stroke-linecap="round"/><rect x="250" y="106" width="52" height="25" rx="8" fill="#E97832"/><circle cx="85" cy="133" r="22" fill="#171A21"/><circle cx="85" cy="133" r="10" fill="#D8E4E8"/><circle cx="273" cy="133" r="22" fill="#171A21"/><circle cx="273" cy="133" r="10" fill="#D8E4E8"/>''', "#E97832"),
}

accessories = {
    "holo-spoiler": ('<path d="M35 70h170l-18 30H60z" fill="#202633" stroke="#32E6D3" stroke-width="5"/><path d="M65 70V38M175 70V38" stroke="#D8E4E8" stroke-width="5"/><path d="M65 38h110" stroke="#FF4FD8" stroke-width="4" filter="url(#glow)"/>', '#32E6D3'),
    "plasma-bumper": ('<path d="M38 75h180l-18 58H56z" rx="15" fill="#202633" stroke="#FF4FD8" stroke-width="5"/><path d="M68 101h120" stroke="#32E6D3" stroke-width="7" stroke-linecap="round" filter="url(#glow)"/><circle cx="54" cy="105" r="8" fill="#FFD447"/><circle cx="202" cy="105" r="8" fill="#FFD447"/>', '#FF4FD8'),
    "neon-underglow": ('<rect x="28" y="72" width="230" height="30" rx="15" fill="#202633"/><path d="M45 87h196" stroke="#32E6D3" stroke-width="10" stroke-linecap="round" filter="url(#glow)"/>', '#32E6D3'),
    "sensor-antenna": ('<path d="M120 132V30" stroke="#D8E4E8" stroke-width="7"/><circle cx="120" cy="25" r="17" fill="#B9F227" filter="url(#glow)"/><path d="M82 92q38-38 76 0" fill="none" stroke="#32E6D3" stroke-width="5"/>', '#B9F227'),
    "drone-dock": ('<rect x="40" y="62" width="180" height="74" rx="16" fill="#202633" stroke="#8C6CFF" stroke-width="5"/><circle cx="130" cy="98" r="25" fill="#32E6D3" opacity=".8"/><path d="M105 98h50M130 73v50" stroke="#F4F0E6" stroke-width="4"/>', '#8C6CFF'),
    "side-energy-blade": ('<path d="M28 107 214 44l-27 43 56 5-186 48z" fill="#202633" stroke="#FF4FD8" stroke-width="5"/><path d="M60 111 191 73" stroke="#32E6D3" stroke-width="7" filter="url(#glow)"/>', '#FF4FD8'),
    "terrain-skid-plate": ('<path d="M40 54h184l22 42-22 42H40l-22-42z" fill="#202633" stroke="#B9F227" stroke-width="5"/><path d="M62 74h140M55 96h154M62 118h140" stroke="#526A7A" stroke-width="6"/>', '#B9F227'),
    "roof-cargo-pod": ('<path d="M38 108 58 45h140l30 63z" fill="#202633" stroke="#FFD447" stroke-width="5"/><path d="M78 45v63M176 45v63" stroke="#526A7A" stroke-width="5"/><rect x="92" y="60" width="73" height="17" rx="8" fill="#32E6D3"/>', '#FFD447'),
}

for file, content in vehicles.items():
    (VEH / f"{file}.svg").write_text(content, encoding="utf-8")
for file, (body, accent) in accessories.items():
    (ACC / f"{file}.svg").write_text(svg(file.replace('-', ' ').title(), body, accent, "0 0 280 180"), encoding="utf-8")

print(f"Generated {len(vehicles)} vehicle SVGs and {len(accessories)} accessory SVGs in {ROOT}")
