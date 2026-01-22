import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";

import { useGetDuelQuery } from "entities/duel";
import { useSessionStorage } from "shared/lib/useSessionStorage";
import type { ITab } from "shared/ui";
import { TabbedCard } from "shared/ui";
import CodeIcon from "shared/assets/icons/code.svg?react";
import styles from "./CodePanel.module.scss";
import CodeEditor from "./CodeEditor/CodeEditor";

export const CodePanel = () => {
    const { duelId } = useParams();
    const { data: duel } = useGetDuelQuery(Number(duelId), { skip: !duelId });
    const [activeTab, setActiveTab] = useSessionStorage<"my" | "opponent">(
        `duel.${duelId ?? "unknown"}.codeTab`,
        "my",
    );

    const shouldShowOpponentSolution = Boolean(duel?.should_show_opponent_solution);

    useEffect(() => {
        if (!shouldShowOpponentSolution && activeTab !== "my") {
            setActiveTab("my");
        }
    }, [shouldShowOpponentSolution, activeTab]);

    const leftTabs: ITab[] = useMemo(() => {
        if (!shouldShowOpponentSolution) {
            return [
                {
                    label: "Код",
                    leadingIcon: <CodeIcon />,
                    active: true,
                },
            ];
        }

        return [
            {
                label: "Мой код",
                leadingIcon: <CodeIcon />,
                active: activeTab === "my",
                onClick: () => setActiveTab("my"),
            },
            {
                label: "Код оппонента",
                active: activeTab === "opponent",
                onClick: () => setActiveTab("opponent"),
            },
        ];
    }, [activeTab, shouldShowOpponentSolution]);

    return (
        <TabbedCard contentClassName={styles.codePanelContent} tabs={leftTabs}>
            <CodeEditor mode={activeTab} />
        </TabbedCard>
    );
};
