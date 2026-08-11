import { Link } from "react-router-dom";
import { AppRoutes } from "shared/config";

import duelPreviewDark from "../assets/duel-preview-dark.webp";
import duelPreviewLight from "../assets/duel-preview-light.webp";
import styles from "./LandingPage.module.scss";

const DuelPreview = () => (
    <figure className={styles.preview} role="img" aria-label="Демонстрация экрана дуэли">
        <img className={styles.previewDark} src={duelPreviewDark} alt="" />
        <img className={styles.previewLight} src={duelPreviewLight} alt="" />
    </figure>
);

const steps = ["Найди равного", "Решите одну задачу", "Забери победу"];

export const LandingPage = () => (
    <div className={styles.landing}>
        <section className={styles.hero} aria-labelledby="landing-title">
            <p className={styles.eyebrow}>ВЫЗОВ</p>
            <h1 id="landing-title">ДУЭЛЬ НАЧИНАЕТСЯ ЗДЕСЬ</h1>
            <div className={styles.description}>
                <p>Хватит решать задачи в одиночку.</p>
                <p>
                    CoDuels найдёт соперника твоего уровня. Дальше всё решат скорость, точность и
                    код.
                </p>
            </div>
            <Link className={styles.cta} to={`${AppRoutes.AUTH}?tab=register`}>
                Хочу участвовать!
            </Link>
            <p className={styles.hint}>Регистрируйся — и ты в игре</p>
        </section>

        <DuelPreview />

        <ol className={styles.steps} aria-label="Как проходит дуэль">
            {steps.map((step, index) => (
                <li key={step}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    {step}
                </li>
            ))}
        </ol>

        <footer className={styles.footer}>Разработчик — Иван Добрынин</footer>
    </div>
);
