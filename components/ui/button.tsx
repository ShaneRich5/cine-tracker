import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 font-sans font-bold whitespace-nowrap select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "rounded-full border-2 border-ink bg-butter text-ink",
        sticker:
          "rounded-full border-2 border-ink bg-butter text-ink shadow-sticker-sm active:translate-x-px active:translate-y-px active:shadow-none",
        link: "bg-transparent text-accent underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-4 text-sm",
        sm: "h-9 px-3.5 text-[13px]",
        inline: "py-2 text-[13px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
