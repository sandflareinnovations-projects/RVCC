import type { HeroSlideDTO } from "@rvcc/schemas";

export type HeroSlideItem = Partial<HeroSlideDTO> & Pick<HeroSlideDTO, "title1" | "title2" | "description" | "imageUrl">;
export type { HeroSlideDTO };

