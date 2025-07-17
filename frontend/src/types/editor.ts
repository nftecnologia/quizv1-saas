export interface ElementStyle {
  color?: string;
  backgroundColor?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  fontFamily?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  padding?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  width?: number | string;
  height?: number | string;
  opacity?: number;
  animation?: 'none' | 'fadeIn' | 'slideIn' | 'bounce' | 'pulse';
}

export interface ElementCondition {
  id: string;
  type: 'show' | 'hide' | 'skip';
  rules: {
    elementId: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    value: string | number;
  }[];
  logic: 'and' | 'or';
}

export interface BaseElement {
  id: string;
  type: ElementType;
  position: number;
  style: ElementStyle;
  conditions?: ElementCondition[];
  required?: boolean;
  label?: string;
}

export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  variant: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
}

export interface MultipleChoiceElement extends BaseElement {
  type: 'multiple_choice';
  question: string;
  options: {
    id: string;
    label: string;
    value: string;
    image?: string;
    isCorrect?: boolean;
  }[];
  allowMultiple: boolean;
  showImages: boolean;
  layout: 'vertical' | 'horizontal' | 'grid';
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  alt: string;
  caption?: string;
  link?: string;
  fit: 'cover' | 'contain' | 'fill' | 'scale-down';
}

export interface VideoElement extends BaseElement {
  type: 'video';
  src: string;
  poster?: string;
  controls: boolean;
  autoplay: boolean;
  loop: boolean;
  muted: boolean;
  platform?: 'youtube' | 'vimeo' | 'upload';
}

export interface ButtonElement extends BaseElement {
  type: 'button';
  text: string;
  variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
  size: 'sm' | 'md' | 'lg' | 'xl';
  action: {
    type: 'navigate' | 'submit' | 'custom';
    value: string;
  };
  icon?: string;
  iconPosition?: 'left' | 'right';
}

export interface InputElement extends BaseElement {
  type: 'input';
  inputType: 'text' | 'email' | 'tel' | 'number' | 'password' | 'textarea';
  placeholder?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface RatingElement extends BaseElement {
  type: 'rating';
  question: string;
  scale: number;
  scaleType: 'stars' | 'numbers' | 'emoji';
  labels?: {
    min?: string;
    max?: string;
  };
}

export interface ComparisonElement extends BaseElement {
  type: 'comparison';
  items: {
    id: string;
    title: string;
    description?: string;
    image?: string;
    features: string[];
    highlighted?: boolean;
  }[];
  layout: 'side_by_side' | 'table';
}

export interface CarouselElement extends BaseElement {
  type: 'carousel';
  images: {
    id: string;
    src: string;
    alt: string;
    caption?: string;
  }[];
  autoplay: boolean;
  showDots: boolean;
  showArrows: boolean;
  interval: number;
}

export interface TestimonialElement extends BaseElement {
  type: 'testimonial';
  testimonials: {
    id: string;
    name: string;
    role?: string;
    company?: string;
    content: string;
    avatar?: string;
    rating?: number;
  }[];
  layout: 'single' | 'grid' | 'carousel';
}

export interface ChartElement extends BaseElement {
  type: 'chart';
  chartType: 'bar' | 'pie' | 'line' | 'area' | 'donut';
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string[];
      borderColor?: string[];
    }[];
  };
  title?: string;
  showLegend: boolean;
}

export interface PriceElement extends BaseElement {
  type: 'price';
  plans: {
    id: string;
    name: string;
    price: number;
    currency: string;
    period: 'month' | 'year' | 'one-time';
    features: string[];
    highlighted?: boolean;
    buttonText?: string;
    buttonAction?: string;
  }[];
  layout: 'horizontal' | 'vertical';
}

export type ElementType = 
  | 'text'
  | 'multiple_choice'
  | 'image'
  | 'video'
  | 'button'
  | 'input'
  | 'rating'
  | 'comparison'
  | 'carousel'
  | 'testimonial'
  | 'chart'
  | 'price';

export type QuizElement = 
  | TextElement
  | MultipleChoiceElement
  | ImageElement
  | VideoElement
  | ButtonElement
  | InputElement
  | RatingElement
  | ComparisonElement
  | CarouselElement
  | TestimonialElement
  | ChartElement
  | PriceElement;

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  elements: QuizElement[];
  settings: {
    theme: 'light' | 'dark' | 'custom';
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    customCSS?: string;
    showProgressBar: boolean;
    allowBackNavigation: boolean;
    autoSave: boolean;
    responsive: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface EditorState {
  quiz: Quiz;
  selectedElement: string | null;
  previewMode: boolean;
  isDragging: boolean;
  clipboard: QuizElement | null;
  history: {
    past: Quiz[];
    present: Quiz;
    future: Quiz[];
  };
}