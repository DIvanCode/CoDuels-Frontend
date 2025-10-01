import { useGetDuelQuery } from "entities/duel";
import { useNavigate, useParams } from "react-router-dom";
import { AppRoutes } from "shared/config";
import { SubmitButton } from "shared/ui";

const DuelPage = () => {
    const { duelId = "" } = useParams();

    const { data: duel, isLoading } = useGetDuelQuery(duelId);

    const navigate = useNavigate();

    const onNewDuelClick = () => {
        navigate(AppRoutes.INDEX);
    };

    if (isLoading) {
        return <div>Загружаем данные дуэли...</div>;
    }

    if (!duel) {
        return <div>Ошибка: дуэль не найдена</div>;
    }

    return (
        <div>
            <h2>Дуэль #{duel.id}</h2>
            <p>Статус: {duel.status}</p>
            <p>Противник: {duel.opponent_user_id}</p>
            {duel.status === "finished" && (
                <div>
                    <p>Победитель: {duel.winner_user_id ?? "ничья"}</p>
                    <SubmitButton onClick={onNewDuelClick}>Новая дуэль</SubmitButton>
                </div>
            )}
        </div>
    );
};

export default DuelPage;
