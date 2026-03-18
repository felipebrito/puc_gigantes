import React from "react";

const GooeyLoader = React.forwardRef(
    ({ className, primaryColor, secondaryColor, borderColor, ...props }, ref) => {
        // Falls back to app CSS variables or hardcoded defaults
        const style = {
            "--gooey-primary-color": primaryColor || "var(--primary, #ff4d4d)",
            "--gooey-secondary-color": secondaryColor || "#ffffff",
            "--gooey-border-color": borderColor || "transparent",
        };

        // Simple class merging
        const computedClassName = `relative flex items-center justify-center text-sm ${className || ""}`;

        return (
            <div
                ref={ref}
                className={computedClassName}
                style={style}
                role="status"
                aria-label="Loading"
                {...props}
            >
                {/* SVG filter for the gooey effect */}
                <svg className="absolute w-0 h-0" style={{ position: 'absolute', width: 0, height: 0 }}>
                    <defs>
                        <filter id="gooey-loader-filter">
                            <feGaussianBlur in="SourceGraphic" stdDeviation={12} result="blur" />
                            <feColorMatrix
                                in="blur"
                                mode="matrix"
                                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 48 -7"
                                result="goo"
                            />
                            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
                        </filter>
                    </defs>
                </svg>

                {/* Embedded styles */}
                <style>
                    {`
            .gooey-loader {
              width: 12em;
              height: 3em;
              position: relative;
              overflow: hidden;
              /* border-bottom: 8px solid var(--gooey-border-color); */
              filter: url(#gooey-loader-filter);
            }

            .gooey-loader::before,
            .gooey-loader::after {
              content: '';
              position: absolute;
              border-radius: 50%;
            }

            .gooey-loader::before {
              width: 22em;
              height: 18em;
              background-color: var(--gooey-primary-color);
              left: -2em;
              bottom: -18em;
              animation: gooey-loader-wee1 2s linear infinite;
            }

            .gooey-loader::after {
              width: 16em;
              height: 12em;
              background-color: var(--gooey-secondary-color);
              left: -4em;
              bottom: -12em;
              animation: gooey-loader-wee2 2s linear infinite 0.75s;
            }

            @keyframes gooey-loader-wee1 {
              0% {
                transform: translateX(-10em) rotate(0deg);
              }
              100% {
                transform: translateX(7em) rotate(180deg);
              }
            }

            @keyframes gooey-loader-wee2 {
              0% {
                transform: translateX(-8em) rotate(0deg);
              }
              100% {
                transform: translateX(8em) rotate(180deg);
              }
            }
          `}
                </style>

                {/* The loader element that the styles target */}
                <div className="gooey-loader" />
            </div>
        );
    }
);
GooeyLoader.displayName = "GooeyLoader";

export { GooeyLoader };
