export type SVG = React.FC<React.SVGProps<SVGSVGElement>>;

export interface ICuisine {
  // Name is the cuisine as it's rendered. Don't forget capitalizations
  name: string;
  href: string;
  svg: SVG;
  pageSvgMobile?: SVG;
  pageSvgDesktop?: SVG;
  popularity: number;
}

export enum CuisineSymbol {
  ITALIAN = 'ITALIAN',
  FRENCH = 'FRENCH',
  BRAZILIAN = 'BRAZILIAN',
  JAPANESE = 'JAPANESE',
  CHINESE = 'CHINESE',
  INDIAN = 'INDIAN',
  SPANISH = 'SPANISH',
  BRITISH = 'BRITISH',
  AMERICAN = 'AMERICAN',
  MEXICAN = 'MEXICAN',
  CARIBBEAN = 'CARIBBEAN',
  MEDITERRANEAN = 'MEDITERRANEAN',
  MIDDLE_EASTERN = 'MIDDLE_EASTERN',
}
