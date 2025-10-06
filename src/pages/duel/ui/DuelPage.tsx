import { useGetDuelQuery } from "entities/duel";
import { useParams } from "react-router-dom";
import Editor from "widgets/code-editor/ui/CodeEditor";

const DuelPage = () => {
    const { duelId = "" } = useParams();

    const { data: duel, isLoading } = useGetDuelQuery(duelId);

    if (isLoading) {
        return <div>Загружаем данные дуэли...</div>;
    }

    if (!duel) {
        return <div>Ошибка: дуэль не найдена</div>;
    }

    return (
        <div>
            <Editor />
        </div>
    );
};

export default DuelPage;
