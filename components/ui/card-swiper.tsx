"use client";

import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import { cn } from "@/lib/utils";

interface CardSwiperProps {
  children: React.ReactNode;
  className?: string;
  slidesPerViewMobile?: number;
  slidesPerViewTablet?: number;
  slidesPerViewDesktop?: number;
}

export function CardSwiper({ 
  children, 
  className,
  slidesPerViewMobile = 1.2,
  slidesPerViewTablet = 2.2,
  slidesPerViewDesktop = 3
}: CardSwiperProps) {
  const childArray = React.Children.toArray(children);

  return (
    <div className={cn("w-full", className)}>
      <Swiper
        modules={[FreeMode]}
        spaceBetween={16}
        slidesPerView={slidesPerViewMobile}
        freeMode={true}
        breakpoints={{
          640: { slidesPerView: slidesPerViewTablet },
          1024: { slidesPerView: slidesPerViewDesktop },
        }}
        className="w-full pb-2"
      >
        {childArray.map((child, index) => (
          <SwiperSlide key={index} className="!h-auto cursor-grab active:cursor-grabbing">
            <div className="h-full flex flex-col">
              {child}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
