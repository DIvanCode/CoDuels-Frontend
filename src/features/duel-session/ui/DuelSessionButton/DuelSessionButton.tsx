import {
    useCancelDuelSearchMutation,
    useStartDuelSearchMutation,
} from "features/duel-session/api/duelSessionApi";
import {
    beginDuelSearch,
    beginDuelSearchCancellation,
    confirmDuelSearch,
    confirmDuelSearchCancellation,
    failDuelSearch,
    failDuelSearchCancellation,
} from "features/duel-session/model/duelSessionSlice";
import { selectDuelSession } from "features/duel-session/model/selectors";
import { DuelSessionPhase } from "features/duel-session/model/types";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "shared/lib/storeHooks";
import { Button } from "shared/ui";

export const DuelSessionButton = () => {
    const navigate = useNavigate();

    const dispatch = useAppDispatch();

    const { phase, activeDuelId, pendingOperation } = useAppSelector(selectDuelSession);
    const prevPhaseRef = useRef<DuelSessionPhase>(phase);
    const [startDuelSearch] = useStartDuelSearchMutation();
    const [cancelDuelSearch] = useCancelDuelSearchMutation();

    useEffect(() => {
        if (prevPhaseRef.current === "searching" && phase === "active" && activeDuelId) {
            navigate("/duel/" + activeDuelId);
        }

        prevPhaseRef.current = phase;
    }, [phase, activeDuelId, navigate]);

    const handleClick = async () => {
        if (phase === "idle") {
            const { generation } = dispatch(
                beginDuelSearch({
                    nickname: null,
                    configurationId: null,
                    invitationType: "Ranked",
                    tournamentId: null,
                }),
            ).payload;

            try {
                await startDuelSearch().unwrap();
            } catch {
                dispatch(failDuelSearch({ generation }));
                return;
            }
            dispatch(confirmDuelSearch({ generation }));
        } else if (phase === "searching") {
            const { generation } = dispatch(beginDuelSearchCancellation()).payload;
            try {
                await cancelDuelSearch().unwrap();
            } catch {
                dispatch(failDuelSearchCancellation({ generation }));
                return;
            }
            dispatch(confirmDuelSearchCancellation({ generation }));
        } else if (phase === "active" && activeDuelId) {
            navigate("/duel/" + activeDuelId);
        }
    };

    const duelButtonText = () => {
        if (phase === "idle") {
            return "Начать поиск";
        } else if (phase === "searching") {
            return pendingOperation === "start" ? "Запуск..." : "Отменить";
        } else if (phase === "active") {
            return "Перейти к дуэли";
        } else if (phase === "finished") {
            return "Загрузка результата...";
        } else if (phase === "interrupted") {
            return "Соединение прервано";
        } else if (phase === "configuring" && pendingOperation === "cancel") {
            return "Отмена...";
        }
        return "Начать поиск";
    };

    const disabled =
        phase === "finished" ||
        phase === "interrupted" ||
        (phase === "searching" && pendingOperation === "start") ||
        (phase === "configuring" && pendingOperation === "cancel");

    return (
        <Button onClick={handleClick} disabled={disabled}>
            {duelButtonText()}
        </Button>
    );
};
