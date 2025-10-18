import { ResultTitle, Table } from "shared/ui";

import styles from "./TaskSubmissionsContent.module.scss";

// TODO: естественно мок, все просто руками забито
export const TaskSubmissionsContent = () => {
    return (
        <Table className={styles.submissionsTable}>
            <thead>
                <tr>
                    <th>Статус</th>
                    <th>Язык</th>
                    <th>Время отправки</th>
                </tr>
            </thead>

            <tbody>
                <tr>
                    <td>
                        <ResultTitle variant="success">Зачтено</ResultTitle>
                    </td>
                    <td>JavaScript</td>
                    <td>01.01.1970 12:00:00</td>
                </tr>

                <tr>
                    <td>
                        <ResultTitle variant="failure">Ошибка компиляции</ResultTitle>
                    </td>
                    <td>JavaScript</td>
                    <td>01.01.1970 12:00:00</td>
                </tr>

                <tr>
                    <td>
                        <ResultTitle variant="failure">
                            Превышено ограничение по времени
                        </ResultTitle>
                    </td>
                    <td>JavaScript</td>
                    <td>01.01.1970 12:00:00</td>
                </tr>

                <tr>
                    <td>
                        <ResultTitle variant="failure">Неправильный ответ на тесте 42</ResultTitle>
                    </td>
                    <td>JavaScript</td>
                    <td>01.01.1970 12:00:00</td>
                </tr>

                <tr>
                    <td>
                        <ResultTitle variant="failure">Неправильный ответ на тесте 42</ResultTitle>
                    </td>
                    <td>JavaScript</td>
                    <td>01.01.1970 12:00:00</td>
                </tr>

                <tr>
                    <td>
                        <ResultTitle variant="failure">Неправильный ответ на тесте 42</ResultTitle>
                    </td>
                    <td>JavaScript</td>
                    <td>01.01.1970 12:00:00</td>
                </tr>

                <tr>
                    <td>
                        <ResultTitle variant="failure">Неправильный ответ на тесте 42</ResultTitle>
                    </td>
                    <td>JavaScript</td>
                    <td>01.01.1970 12:00:00</td>
                </tr>

                <tr>
                    <td>
                        <ResultTitle variant="failure">Неправильный ответ на тесте 42</ResultTitle>
                    </td>
                    <td>JavaScript</td>
                    <td>01.01.1970 12:00:00</td>
                </tr>

                <tr>
                    <td>
                        <ResultTitle variant="failure">Неправильный ответ на тесте 42</ResultTitle>
                    </td>
                    <td>JavaScript</td>
                    <td>01.01.1970 12:00:00</td>
                </tr>
            </tbody>
        </Table>
    );
};
