import Image, { type StaticImageData } from "next/image";
import type { Lang } from "@/site/content";
import efficiency from "../../../public/images/business-value/business-value-efficiency.png";
import growth from "../../../public/images/business-value/business-value-growth.png";
import decisions from "../../../public/images/business-value/business-value-decisions.png";
import { valueCopy, type ValueImage } from "./valueCopy";
import styles from "./value.module.css";

/**
 * Sections 3–5: business value. Three editorial rows, alternating copy and
 * image (copy first, image first, copy first, in the reading direction, so
 * Arabic mirrors the placement but never the photographs). Each photograph
 * runs to the edge of the page and fades into the paper on its other sides.
 * Scroll reveal only (LabMotion); nothing else moves.
 */
const images: Record<ValueImage, StaticImageData> = { efficiency, growth, decisions };

export default function BusinessValue({ lang }: { lang: Lang }) {
  return (
    <>
      {valueCopy[lang].map((b, i) => {
        const id = `bv-${b.image}`;
        return (
          <section key={b.image} className={`${styles.block} ${i % 2 ? styles.flip : ""}`} aria-labelledby={id}>
            <div className={styles.copy} data-reveal>
              <p className={styles.eyebrow}>{b.eyebrow}</p>
              <h2 id={id} className={styles.title}>
                {b.lead} <span className={styles.accent}>{b.highlight}</span>
              </h2>
              <p className={styles.text}>{b.text}</p>
            </div>
            <div className={styles.media} data-reveal style={{ "--i": 1 } as React.CSSProperties}>
              <Image
                src={images[b.image]}
                alt=""
                quality={85}
                placeholder="blur"
                sizes="(max-width: 900px) 100vw, 62vw"
                className={styles.img}
              />
            </div>
          </section>
        );
      })}
    </>
  );
}
