import clsx from "clsx";
import { ComponentPropsWithoutRef } from "react";

import styles from "./SubmitButton.module.scss";

type Props = ComponentPropsWithoutRef<"button">;
export const SubmitButton = ({ className, ...props }: Props) => {
    return <button type="submit" className={clsx(styles.submitButton, className)} {...props} />;
};
