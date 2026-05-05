import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";

import { useGetDuelQuery } from "entities/duel";
import { selectCurrentUser } from "entities/user";
import { useSessionStorage } from "shared/lib/useSessionStorage";
import { useAppSelector } from "shared/lib/storeHooks";
import type { ITab } from "shared/ui";
import { TabbedCard } from "shared/ui";
import CodeIcon from "shared/assets/icons/code.svg?react";
import styles from "./CodePanel.module.scss";
import CodeEditor from "./CodeEditor/CodeEditor";

export const CodePanel = () => {
    const { duelId } = useParams();
    const { data: duel } = useGetDuelQuery(Number(duelId), { skip: !duelId });
    const currentUser = useAppSelector(selectCurrentUser);
    const [activeTab, setActiveTab] = useSessionStorage<"my" | "opponent">(
        `duel.${duelId ?? "unknown"}.codeTab`,
        "my",
    );

    const participants = duel?.participants ?? [];
    const isParticipant = participants.some((participant) => participant.id === currentUser?.id);
    const primaryParticipant = participants[0];
    const secondaryParticipant = participants[1];
    const shouldShowOpponentSolution = Boolean(duel?.should_show_opponent_solution);

    useEffect(() => {
        if (!shouldShowOpponentSolution && activeTab !== "my") {
            setActiveTab("my");
        }
    }, [shouldShowOpponentSolution, activeTab, setActiveTab]);

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
                label: isParticipant ? "Мой код" : (primaryParticipant?.nickname ?? "Участник 1"),
                leadingIcon: <CodeIcon />,
                active: activeTab === "my",
                onClick: () => setActiveTab("my"),
            },
            {
                label: isParticipant
                    ? "Код оппонента"
                    : (secondaryParticipant?.nickname ?? "Участник 2"),
                active: activeTab === "opponent",
                onClick: () => setActiveTab("opponent"),
            },
        ];
    }, [
        activeTab,
        isParticipant,
        primaryParticipant?.nickname,
        secondaryParticipant?.nickname,
        setActiveTab,
        shouldShowOpponentSolution,
    ]);

    return (
        <TabbedCard contentClassName={styles.codePanelContent} tabs={leftTabs}>
            <CodeEditor mode={activeTab} />
        </TabbedCard>
    );
};
