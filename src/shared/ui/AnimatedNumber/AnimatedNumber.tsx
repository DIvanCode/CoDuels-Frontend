import { animated, useSpring } from "@react-spring/web";

interface AnimatedNumberProps {
    value: number;
    from?: number;
    duration?: number;
    className?: string;
}

export const AnimatedNumber = ({ value, from, duration = 500, className }: AnimatedNumberProps) => {
    const spring = useSpring({
        number: value,
        from: { number: from ?? value },
        config: { duration },
    });

    return (
        <animated.span className={className}>
            {spring.number.to((n) => Math.floor(n))}
        </animated.span>
    );
};
