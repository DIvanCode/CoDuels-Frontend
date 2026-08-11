import { Link } from "react-router-dom";
import CodeIcon from "shared/assets/icons/code.svg?react";
import CrossedSwordsIcon from "shared/assets/icons/crossed-swords.svg?react";
import DocumentIcon from "shared/assets/icons/document.svg?react";
import InboxIcon from "shared/assets/icons/inbox.svg?react";
import UserIcon from "shared/assets/icons/user.svg?react";
import { AppRoutes } from "shared/config";

import styles from "./LandingPage.module.scss";

const codeLines = [
    { id: "include", value: "#include <bits/stdc++.h>" },
    { id: "blank-after-include", value: "" },
    { id: "namespace", value: "using namespace std;" },
    { id: "blank-after-namespace", value: "" },
    { id: "main", value: "int main() {" },
    { id: "variables", value: "    int n, k;" },
    { id: "read-size", value: "    cin >> n >> k;" },
    { id: "vector", value: "    vector<int> a(n);" },
    { id: "read-loop", value: "    for (int i = 0; i < n; i++) {" },
    { id: "read-item", value: "        cin >> a[i];" },
    { id: "read-loop-end", value: "    }" },
    { id: "set", value: "    set<pair<int, int>> values;" },
    { id: "window-loop", value: "    for (int i = 0; i < k; i++) {" },
    { id: "insert", value: "        values.insert({a[i], i});" },
    { id: "window-loop-end", value: "    }" },
];

const Participant = ({ nickname, rating }: { nickname: string; rating: number }) => (
    <div className={styles.participant}>
        <UserIcon className={styles.avatar} aria-hidden="true" />
        <div className={styles.participantText}>
            <strong>{nickname}</strong>
            <span>🏆 {rating}</span>
        </div>
    </div>
);

const DuelPreview = () => (
    <article className={styles.preview} aria-label="Демонстрация экрана дуэли">
        <header className={styles.previewHeader}>
            <Participant nickname="DIvanCode" rating={1539} />
            <div className={styles.timer} aria-label="До конца дуэли 10 минут 31 секунда">
                <CrossedSwordsIcon aria-hidden="true" />
                <strong>10:31</strong>
            </div>
            <Participant nickname="nightCoder" rating={1528} />
        </header>

        <div className={styles.duelWorkspace}>
            <section className={styles.editorPanel} aria-label="Редактор кода">
                <div className={styles.panelTabs}>
                    <span className={styles.activeTab}>
                        <CodeIcon aria-hidden="true" />
                        Мой код
                    </span>
                    <span>Код оппонента</span>
                </div>
                <div className={styles.editorToolbar}>
                    <span>C++</span>
                    <span className={styles.submitLabel}>
                        <InboxIcon aria-hidden="true" />
                        Отправить
                    </span>
                </div>
                <ol className={styles.code}>
                    {codeLines.map((line) => (
                        <li key={line.id}>
                            <code>{line.value || " "}</code>
                        </li>
                    ))}
                </ol>
            </section>

            <section className={styles.taskPanel} aria-labelledby="preview-task-title">
                <div className={styles.taskPicker}>
                    <strong>Задача</strong>
                    <span>A</span>
                </div>
                <div className={styles.panelTabs}>
                    <span className={styles.activeTab}>
                        <DocumentIcon aria-hidden="true" />
                        Условие
                    </span>
                    <span>
                        <InboxIcon aria-hidden="true" />
                        Посылки
                    </span>
                </div>
                <div className={styles.statement}>
                    <h2 id="preview-task-title">Минимум на отрезке</h2>
                    <p>
                        Рассмотрим последовательность целых чисел длины <i>N</i>. По ней с шагом 1
                        двигается «окно» длины <i>K</i>. Требуется для каждого положения определить
                        минимум в нём.
                    </p>
                    <h3>Входные данные</h3>
                    <p>
                        В первой строке содержатся два числа <i>N</i> и <i>K</i> (1 ≤ <i>K</i> ≤
                        <i>N</i>). На следующей строке находятся <i>N</i> чисел — сама
                        последовательность.
                    </p>
                </div>
            </section>
        </div>
    </article>
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
            <p className={styles.hint}>Никнейм и пароль — и ты в игре</p>
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
    </div>
);
