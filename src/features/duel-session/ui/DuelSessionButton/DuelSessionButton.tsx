import { useCancelDuelInvitationMutation } from "entities/duel-invitation";
import {
    useCancelDuelSearchMutation,
    useStartDuelSearchMutation,
} from "features/duel-session/api/duelSessionApi";
import {
    setPhase,
    setSearchConfigurationId,
    setSearchNickname,
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

    const { phase, activeDuelId, searchNickname, searchConfigurationId } =
        useAppSelector(selectDuelSession);
    const prevPhaseRef = useRef<DuelSessionPhase>(phase);
    const [startDuelSearch] = useStartDuelSearchMutation();
    const [cancelDuelSearch] = useCancelDuelSearchMutation();
    const [cancelDuelInvitation] = useCancelDuelInvitationMutation();

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

            try {
                await startDuelSearch().unwrap();
            } catch {
                return;
            }
            dispatch(setPhase("searching"));
        } else if (phase === "searching") {
            if (searchNickname) {
                try {
                    await cancelDuelInvitation({
                        opponent_nickname: searchNickname,
                        configuration_id: searchConfigurationId ?? undefined,
                    }).unwrap();
                } catch {
                    return;
                }
            } else {
                try {
                    await cancelDuelSearch().unwrap();
                } catch {
                    return;
                }
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
