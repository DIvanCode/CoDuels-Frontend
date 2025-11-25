import { setPhase } from "features/duel-session/model/duelSessionSlice";
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

    useEffect(() => {
        if (prevPhaseRef.current === "searching" && phase === "active" && activeDuelId) {
            navigate("/duel/" + activeDuelId);
        }

        prevPhaseRef.current = phase;
    }, [phase, activeDuelId, navigate]);

    const handleClick = () => {
        if (phase === "idle") {
            dispatch(setPhase("searching"));
        } else if (phase === "searching") {
            dispatch(setPhase("idle"));
        } else if (phase === "active" && activeDuelId) {
            navigate("/duel/" + activeDuelId);
        }
    };

    const duelButtonText = () => {
        if (phase === "idle") {
            return "Начать подбор";
        } else if (phase === "searching") {
            return "Отменить";
        } else if (phase === "active") {
            return "Вернуться к дуэли";
        }
        return "Начать подбор";
    };

    return <Button onClick={handleClick}>{duelButtonText()}</Button>;
};
