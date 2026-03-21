import { Link, useNavigate } from "react-router-dom";

import { AppRoutes } from "shared/config";
import type { TournamentBracketNode, TournamentDetailsResponse } from "../../model/types";
import styles from "./SingleEliminationBracketView.module.scss";

const COLUMN_WIDTH = 184;
const ROW_HEIGHT = 56;
const CARD_WIDTH = 152;
const MATCH_CARD_HEIGHT = 44;
const LEAF_CARD_HEIGHT = 22;
const PADDING_X = 24;
const PADDING_Y = 14;

const getNodeLevel = (index: number) => Math.floor(Math.log2(index + 1));

const getDisplayName = (nickname?: string | null) => nickname?.trim() || "";

const getProfilePath = (nickname?: string | null) =>
    AppRoutes.PROFILE.replace(":userNickname", nickname ?? "");

const resolveNodeUser = (
    nodesMap: Map<number, TournamentBracketNode>,
    index: number | null,
): TournamentBracketNode["winner"] | TournamentBracketNode["user"] | null => {
    if (index === null) return null;

    const node = nodesMap.get(index);
    if (!node) return null;

    return node.winner ?? node.user ?? null;
};

const buildPositionedNodes = (nodes: TournamentBracketNode[]) => {
    const maxLevel = nodes.reduce((acc, node) => Math.max(acc, getNodeLevel(node.index)), 0);

    return nodes.map((node) => {
        const level = getNodeLevel(node.index);
        const levelStart = 2 ** level - 1;
        const positionInLevel = node.index - levelStart;
        const span = 2 ** (maxLevel - level);
        const centerSlot = positionInLevel * span + span / 2;

        return {
            node,
            x: (maxLevel - level) * COLUMN_WIDTH + PADDING_X,
            centerY: (centerSlot - 0.5) * ROW_HEIGHT + PADDING_Y,
        };
    });
};

const isLeafNode = (node: TournamentBracketNode) =>
    node.user !== null || (node.left_index === null && node.right_index === null);

export const SingleEliminationBracketView = ({ data }: { data: TournamentDetailsResponse }) => {
    const navigate = useNavigate();
    const rawNodes = data.single_elimination_bracket?.nodes ?? [];
    const nodes = rawNodes.filter((node): node is TournamentBracketNode => node !== null);

    if (nodes.length === 0) {
        return <div>Сетка турнира пока недоступна.</div>;
    }

    const nodesMap = new Map(nodes.map((node) => [node.index, node]));
    const positionedNodes = buildPositionedNodes(nodes);
    const maxX = Math.max(...positionedNodes.map((item) => item.x));
    const maxY = Math.max(
        ...positionedNodes.map(({ node, centerY }) => {
            const height = isLeafNode(node) ? LEAF_CARD_HEIGHT : MATCH_CARD_HEIGHT;
            return centerY + height / 2;
        }),
    );
    const canvasWidth = maxX + CARD_WIDTH + PADDING_X;
    const canvasHeight = maxY + PADDING_Y;

    return (
        <div className={styles.viewport}>
            <div className={styles.canvas} style={{ width: canvasWidth, height: canvasHeight }}>
                <svg className={styles.lines} width={canvasWidth} height={canvasHeight}>
                    {positionedNodes.map(({ node, x, centerY }) => {
                        const parentX = x + CARD_WIDTH;
                        const parentY = centerY;

                        return [node.left_index, node.right_index].map((childIndex) => {
                            if (childIndex === null) return null;

                            const child = positionedNodes.find(
                                (positioned) => positioned.node.index === childIndex,
                            );

                            if (!child) return null;

                            const childX = child.x;
                            const childY = child.centerY;
                            const childAnchorX = childX + CARD_WIDTH;
                            const middleX = childAnchorX + (COLUMN_WIDTH - CARD_WIDTH) / 2;
                            const key = `${node.index}-${childIndex}`;

                            return (
                                <path
                                    key={key}
                                    className={styles.connector}
                                    d={`M ${childAnchorX} ${childY} H ${middleX} V ${parentY} H ${parentX}`}
                                />
                            );
                        });
                    })}
                </svg>

                {positionedNodes.map(({ node, x, centerY }) => {
                    if (isLeafNode(node)) {
                        const nickname = getDisplayName(node.user?.nickname);
                        const top = centerY - LEAF_CARD_HEIGHT / 2;

                        return (
                            <div
                                key={node.index}
                                className={`${styles.card} ${styles.leafCard}`}
                                style={{ left: x, top }}
                            >
                                {nickname ? (
                                    <Link
                                        className={styles.leafNicknameLink}
                                        to={getProfilePath(node.user?.nickname)}
                                    >
                                        {nickname}
                                    </Link>
                                ) : (
                                    <div className={styles.leafNickname}>{nickname}</div>
                                )}
                            </div>
                        );
                    }

                    const topUser = resolveNodeUser(nodesMap, node.left_index);
                    const bottomUser = resolveNodeUser(nodesMap, node.right_index);
                    const winnerId =
                        node.duel_status === "Finished" ? (node.winner?.id ?? null) : null;
                    const top = centerY - MATCH_CARD_HEIGHT / 2;
                    const isInteractiveDuel =
                        node.duel_id !== null &&
                        (node.duel_status === "InProgress" || node.duel_status === "Finished");
                    const duelPath = isInteractiveDuel
                        ? AppRoutes.DUEL.replace(":duelId", String(node.duel_id))
                        : null;

                    return (
                        <div
                            key={node.index}
                            className={`${styles.card} ${duelPath ? styles.duelCard : ""}`}
                            style={{ left: x, top }}
                            onClick={duelPath ? () => navigate(duelPath) : undefined}
                            role={duelPath ? "button" : undefined}
                            tabIndex={duelPath ? 0 : undefined}
                            onKeyDown={
                                duelPath
                                    ? (event) => {
                                          if (event.key === "Enter" || event.key === " ") {
                                              event.preventDefault();
                                              navigate(duelPath);
                                          }
                                      }
                                    : undefined
                            }
                        >
                            <div className={styles.matchGrid}>
                                {getDisplayName(topUser?.nickname) && topUser?.nickname ? (
                                    <span className={`${styles.matchCell} ${styles.nicknameCell}`}>
                                        <Link
                                            className={styles.nicknameLink}
                                            to={getProfilePath(topUser.nickname)}
                                            onClick={(event) => event.stopPropagation()}
                                        >
                                            {getDisplayName(topUser.nickname)}
                                        </Link>
                                    </span>
                                ) : (
                                    <span className={`${styles.matchCell} ${styles.nicknameCell}`}>
                                        {getDisplayName(topUser?.nickname)}
                                    </span>
                                )}
                                <span
                                    className={[
                                        styles.matchCell,
                                        styles.resultCell,
                                        styles.result,
                                        winnerId && topUser?.id
                                            ? winnerId === topUser.id
                                                ? styles.resultWin
                                                : styles.resultLoss
                                            : "",
                                    ].join(" ")}
                                >
                                    {winnerId && topUser?.id
                                        ? winnerId === topUser.id
                                            ? "W"
                                            : "L"
                                        : ""}
                                </span>
                                {getDisplayName(bottomUser?.nickname) && bottomUser?.nickname ? (
                                    <span className={`${styles.matchCell} ${styles.nicknameCell}`}>
                                        <Link
                                            className={styles.nicknameLink}
                                            to={getProfilePath(bottomUser.nickname)}
                                            onClick={(event) => event.stopPropagation()}
                                        >
                                            {getDisplayName(bottomUser.nickname)}
                                        </Link>
                                    </span>
                                ) : (
                                    <span className={`${styles.matchCell} ${styles.nicknameCell}`}>
                                        {getDisplayName(bottomUser?.nickname)}
                                    </span>
                                )}
                                <span
                                    className={[
                                        styles.matchCell,
                                        styles.resultCell,
                                        styles.result,
                                        winnerId && bottomUser?.id
                                            ? winnerId === bottomUser.id
                                                ? styles.resultWin
                                                : styles.resultLoss
                                            : "",
                                    ].join(" ")}
                                >
                                    {winnerId && bottomUser?.id
                                        ? winnerId === bottomUser.id
                                            ? "W"
                                            : "L"
                                        : ""}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
