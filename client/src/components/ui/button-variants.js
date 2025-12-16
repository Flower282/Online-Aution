import { cva } from "class-variance-authority";

export const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
    {
        variants: {
            variant: {
                default: "bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl",
                destructive:
                    "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
                outline:
                    "border-2 border-red-500 bg-background text-red-600 hover:bg-red-50 hover:text-red-700 dark:bg-input/30 dark:border-red-600 dark:hover:bg-red-950",
                secondary:
                    "bg-red-100 text-red-700 hover:bg-red-200 border border-red-300",
                ghost:
                    "hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950",
                link: "text-red-600 underline-offset-4 hover:underline hover:text-red-700",
            },
            size: {
                default: "h-9 px-4 py-2 has-[>svg]:px-3",
                sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
                lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
                icon: "size-9 rounded-md",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    },
);
