# Intelligence Core: look-dev (art-direction approval gate)

Three product-design treatments of the same concept: business inputs, the ZentexAI Intelligence Core, useful outputs.
This is look-dev only: no intro choreography, no service switching, no scroll animation. The only motion is pointer parallax
(a damped camera orbit of about ±19° / ±6°) so depth can be judged. Nothing is enabled by default; `/` is unchanged.

## Viewing

| Variant | URL |
|---|---|
| A: Precision Stack | `/?core=A` |
| B: Aperture Stack | `/?core=B` |
| C: Modular Core | `/?core=C` |

Add `&view=detail` for a closer camera (labels hidden). Desktop only (>= 1024 px); below that the normal SVG flow shows.
Move the mouse across the page to orbit the camera.

## What is shared

- Raw three.js, no new dependency. Material: anodised-graphite `MeshPhysicalMaterial` (anisotropic highlights, brushed roughness
  generated on a canvas at runtime). Studio lighting from a procedural `RoomEnvironment`: no HDR, no request.
- Brand blue/cyan appears only as emissive light: signal path, gate edges, state strips.
- Labels (Messages, Documents, Project data, Business data / Actions, Insights, Automation, Decisions) are HTML, projected from scene anchors.
- Rendering is on demand (a frame is drawn only while the camera moves). Off-screen it pauses. Context loss returns to the SVG.
- In look-dev mode only, the hero intro paragraph is narrowed to 26rem to make room for the input labels.

## Code

`src/components/core3d/` (params, geometry, materials, mount, three variant builders, HTML label host) and
`src/components/flow/HeroVisual.tsx` (chooses between the default flow figure and the look-dev core).
`HomeContent.tsx` only swaps `<FlowStage />` for `<HeroVisual />` and adds `overflow-x-clip` / `relative z-10` (no visual change on `/`).
