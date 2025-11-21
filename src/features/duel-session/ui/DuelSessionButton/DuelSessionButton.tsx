import { setPhase } from "features/duel-session/model/duelSessionSlice";
import { selectDuelSession } from "features/duel-session/model/selectors";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "shared/lib/storeHooks";
import { Button } from "shared/ui";

export const DuelSessionButton = () => {
    const dispatch = useAppDispatch();

    const { phase, activeDuelId } = useAppSelector(selectDuelSession);

    const navigate = useNavigate();

    useEffect(() => {
        if (phase === "active" && activeDuelId) {
            navigate("/duel/" + activeDuelId);
        }
    }, [phase, activeDuelId, navigate]);

    const handleClick = () => {
        if (phase === "idle") {
            dispatch(setPhase("searching"));
        } else if (phase === "searching") {
            dispatch(setPhase("idle"));
        }
    };

    return (
        <Button onClick={handleClick}>
            {phase === "searching" ? "Отменить" : "Начать подбор"}
        </Button>
    );
};
