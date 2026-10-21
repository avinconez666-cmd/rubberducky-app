# Rubberducky Garage Packages

The garage catalog lives in `mobile-app/constants/vehicle-customization.ts`. It provides the body-paint palette, SVG references, attachment slots, package membership, and unlock criteria used by the Garage screen.

## Pricing design

| Tier | Price | Unlocks | Criteria |
|---|---:|---|---|
| Starter Garage | Free | Compact Car, Electric Scooter, core paints, milestone accessories | Available to every driver |
| Road Crew | $4.99 one-time | Sport Package, Sci-Fi Hover Coupe, Plasma Bumper, Holographic Spoiler | Purchase tier; the existing Regular milestone still grants free neon accents |
| Trail Pass | $6.99 one-time | Off-Road Package, Monster Truck, Sci-Fi Utility Shuttle, Terrain Skid Plate | Purchase tier; Adventure Van and basic cargo remain milestone-unlockable |
| Signal Plus | $3.99/month | Space Explorer Package, Recon Rover, Orbital Bike, Drone Dock, Energy Blade | Active subscription; preview remains available before subscribing |

Prices are represented as integer cents in the catalog and are a product-design configuration only. They are not connected to a payment provider yet.

## Unlock philosophy

The free garage keeps the current behavior: radio use, messages, hazard pins, accepted friends, and distance milestones unlock practical pieces. Paid tiers add themed collections rather than removing the free path. The Garage screen shows the tiers as a catalog and continues to enforce the existing milestone locks for the original pieces.

## SVG assets

- Vehicles: `mobile-app/assets/garage/vehicles/`
- Accessories: `mobile-app/assets/garage/accessories/`
- Coordinate offsets: `ATTACHMENT_OFFSETS` in `mobile-app/constants/vehicle-customization.ts`

All SVGs are standalone, transparent, scalable assets with a `title` and `desc` for accessible metadata. The generator is retained at `scripts/generate_vehicle_svgs.py` so the set can be regenerated consistently.
