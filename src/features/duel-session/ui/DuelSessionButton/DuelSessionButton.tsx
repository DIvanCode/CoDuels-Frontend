import {
    useCancelDuelSearchMutation,
    useStartDuelSearchMutation,
} from "features/duel-session/api/duelSessionApi";
import {
    setPhase,
    setSearchConfigurationId,
    setSearchInvitationType,
    setSearchNickname,
    setSearchTournamentId,
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

    const { phase, activeDuelId } = useAppSelector(selectDuelSession);
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
            dispatch(setSearchNickname(null));
            dispatch(setSearchConfigurationId(null));
            dispatch(setSearchInvitationType(null));
            dispatch(setSearchTournamentId(null));

            try {
                await startDuelSearch().unwrap();
            } catch {
                return;
            }
            dispatch(setPhase("searching"));
        } else if (phase === "searching") {
            try {
                await cancelDuelSearch().unwrap();
            } catch {
                return;
            }
            dispatch(setPhase("idle"));
        } else if (phase === "active" && activeDuelId) {
            navigate("/duel/" + activeDuelId);
        }
    };

    const duelButtonText = () => {
        if (phase === "idle") {
            return "Начать поиск";
        } else if (phase === "searching") {
            return "Отменить";
        } else if (phase === "active") {
            return "Перейти к дуэли";
        }
        return "Начать поиск";
    };

    return <Button onClick={handleClick}>{duelButtonText()}</Button>;
};
