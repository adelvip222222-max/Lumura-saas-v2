"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Package } from "lucide-react";

interface HeroSlide {
  url: string;
  alt?: string;
}

interface Props {
  slides: HeroSlide[];
  fallbackImage?: string;
  storeName: string;
  caption: string;
  isAr: boolean;
}

export function StoreHomeHeroSlider({
  slides,
  fallbackImage,
  storeName,
  caption,
  isAr,
}: Props) {
  const images = useMemo(
    () =>
      (slides.length ? slides : fallbackImage ? [{ url: fallbackImage, alt: storeName }] : [])
        .filter((slide) => slide.url)
        .slice(0, 3),
    [fallbackImage, slides, storeName]
  );
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;

    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % images.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, [images.length]);

  const goPrevious = () => {
    setActiveIndex((index) => (index === 0 ? images.length - 1 : index - 1));
  };

  const goNext = () => {
    setActiveIndex((index) => (index + 1) % images.length);
  };

  return (
    <div className="relative">
      <div className="absolute -inset-5 bg-slate-100" />
      <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
        {images.length ? (
          images.map((image, index) => (
            <img
              key={`${image.url}-${index}`}
              src={image.url}
              alt={image.alt || storeName}
              className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${
                index === activeIndex ? "scale-100 opacity-100" : "scale-105 opacity-0"
              }`}
              fetchPriority={index === 0 ? "high" : "auto"}
            />
          ))
        ) : (
          <div className="grid h-full place-items-center">
            <Package className="h-24 w-24 text-slate-300" />
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-6 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/75">
            {storeName}
          </p>
          <p className="mt-2 text-2xl font-black">{caption}</p>
        </div>

        {images.length > 1 && (
          <>
            <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`Show slide ${index + 1}`}
                  onClick={() => setActiveIndex(index)}
                  className={`h-2.5 rounded-full transition-all ${
                    index === activeIndex ? "w-8 bg-white" : "w-2.5 bg-white/65 hover:bg-white"
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              aria-label="Previous slide"
              onClick={goPrevious}
              className="absolute top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/35 text-white backdrop-blur transition hover:bg-black/55 sm:grid"
              style={{ [isAr ? "right" : "left"]: "1rem" }}
            >
              {isAr ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
            <button
              type="button"
              aria-label="Next slide"
              onClick={goNext}
              className="absolute top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/35 text-white backdrop-blur transition hover:bg-black/55 sm:grid"
              style={{ [isAr ? "left" : "right"]: "1rem" }}
            >
              {isAr ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
