# AI Agents scene: phone asset attribution

## Source
"Modern Generic Smartphone" by Ottto3d
https://sketchfab.com/3d-models/modern-generic-smartphone-cb96f6c19c6c416f8f52a127dd6ec05b

## Licence
CC BY 4.0 (Creative Commons Attribution 4.0): https://creativecommons.org/licenses/by/4.0/
Commercial use and modification are explicitly permitted. Required: appropriate credit, a link
to the licence, and an indication of changes made (below). No brand marks in the source model.

## Attribution text (to include on a credits/acknowledgements page before this ships)
"Modern Generic Smartphone" by Ottto3d (https://sketchfab.com/3d-models/modern-generic-smartphone-cb96f6c19c6c416f8f52a127dd6ec05b),
licensed under CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Modified for use as the
ZentexAI homepage AI Agents illustration.

## Provenance
Downloaded by the site owner directly from Sketchfab (requires a logged-in account; not
fetchable by an automated agent) to:
  /Users/zaidalbadareen/Downloads/modern-generic-smartphone/
That original download was not modified or deleted by this process. Verified complete: Blend,
FBX, OBJ+MTL, and 5 PBR textures (diffuse, metallic, roughness, opacity, normal, all 2048x2048)
inside source/phone.zip, plus a Sketchfab-generated GLTF-ready textures/ copy alongside it (a
generic "internal_ground_ao_texture.jpeg" placeholder was also present, unused by this model's
single material and not carried into the production asset).

## Modifications made for production use
Source: source/phone.zip -> formats/phone.obj + phone.mtl (single mesh, single material,
2,656 triangles, real-world scale in metres, 15cm x 7.5cm x ~1.06cm).

1. Converted OBJ+MTL to glTF (obj2gltf), then rebuilt the material with @gltf-transform/core:
   - Base colour: phone_diffuse.png, resized 2048 -> 1024, exported as JPEG (q90).
   - Normal map: phone_normal.png, resized 2048 -> 1024, PNG.
   - Metallic/roughness: the source MTL used a non-standard "refl" key for metalness, which the
     OBJ->glTF conversion cannot read, and glTF requires occlusion/roughness/metalness packed
     into one texture (R/G/B). Packed a new ORM texture from phone_roughness.png (-> G) and
     phone_metallic.png (-> B), R channel unused (255), metallicFactor/roughnessFactor set to 1
     so the map values are used directly.
   - Opacity map dropped: it is ~100% white (fully opaque) except one small translucent dot on a
     camera-lens decal; material set to alphaMode OPAQUE.
   - baseColorFactor set to a cool dark tint (0.62, 0.66, 0.72) multiplied over the source
     texture, to match the site's dark-graphite direction, without repainting the texture.
2. No geometry, UVs or topology were changed. No polygon count increase.
3. Exported as a single binary GLB: public/models/ai-agents-phone.glb (~311 KB).

## Screen placement (measured, not eyeballed)
The source OBJ was parsed directly to find the flat, forward-facing (+Z) face group and its
exact local-space bounding box, so the ZentexAI conversation UI overlay is positioned and sized
from the real geometry rather than guessed:
  overall bounding box: 0.075116 x 0.149653 x 0.010645 m (w x h x d)
  front (screen) face bounding box: 0.073077 x 0.148647 m, flat at local z = 0.004497
This model's front is a single flat slab (no separate physical screen recess); the UI plane is
composited on top of it and inset from the true edge to leave the model's own thin edge as a
bezel.
