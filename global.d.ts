// To use CSS modules with TS
declare module "*.module.scss" {
    interface IClassNames {
        [className: string]: string;
    }
    const classNames: IClassNames;
    export = classNames;
}

// To use svg as React component
declare module "*.svg?react" {
    import React from "react";

    const SVG: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
    export default SVG;
}
