import React, {
  memo,
  useCallback,
  useMemo,
} from "react";
import type {
  CSSProperties,
  MouseEvent,
} from 'react';

import { useDrop } from "react-dnd";

import cx from "classnames";

import {
  ColorStyles,
  Column,
  ColumnData,
  ColumnResizeEvent,
  DateSetup,
  DependencyMap,
  Distances,
  Icons,
  Task,
  TaskOrEmpty,
} from "../../types/public-types";

import styles from "./task-list-table-row.module.css";
import { ROW_DRAG_TYPE } from "../../constants";

type TaskListTableRowProps = {
  canMoveTasks: boolean;
  colors: ColorStyles;
  columnResizeEvent: ColumnResizeEvent | null;
  columns: readonly Column[];
  dateSetup: DateSetup;
  dependencyMap: DependencyMap;
  depth: number;
  distances: Distances;
  fullRowHeight: number;
  getTaskCurrentState: (task: Task) => Task;
  handleAddTask: (task: Task) => void;
  handleDeteleTask: (task: TaskOrEmpty) => void;
  handleEditTask: (task: TaskOrEmpty) => void;
  handleMoveTaskAfter: (target: TaskOrEmpty, taskForMove: TaskOrEmpty) => void;
  handleMoveTaskInside: (parent: Task, child: TaskOrEmpty) => void;
  hasChildren: boolean;
  icons?: Partial<Icons>;
  indexStr: string;
  isClosed: boolean;
  isEven: boolean;
  isSelected: boolean;
  isShowTaskNumbers: boolean;
  onExpanderClick: (task: Task) => void;
  scrollToTask: (task: Task) => void;
  selectTaskOnClick: (taskId: string, event: MouseEvent) => void;
  style?: CSSProperties;
  task: TaskOrEmpty;
};

const TaskListTableRowInner: React.FC<TaskListTableRowProps> = ({
  canMoveTasks,
  colors,
  columnResizeEvent,
  columns,
  dateSetup,
  dependencyMap,
  depth,
  distances,
  fullRowHeight,
  getTaskCurrentState,
  handleAddTask,
  handleDeteleTask,
  handleEditTask,
  handleMoveTaskAfter,
  handleMoveTaskInside,
  hasChildren,
  icons = undefined,
  indexStr,
  isClosed,
  isEven,
  isSelected,
  isShowTaskNumbers,
  onExpanderClick,
  scrollToTask,
  selectTaskOnClick,
  style = undefined,
  task,
}) => {
  const {
    id,
    comparisonLevel = 1,
  } = task;

  const onRootClick = useCallback((event: MouseEvent) => {
    if (task.type === 'empty') {
      return;
    }

    scrollToTask(task);
    selectTaskOnClick(task.id, event);
  }, [
    scrollToTask,
    selectTaskOnClick,
    task,
  ]);

  const [dropInsideProps, dropInside] = useDrop({
    accept: ROW_DRAG_TYPE,

    drop: (item: TaskOrEmpty, monitor) => {
      if (
        monitor.didDrop()
        || task.type === "empty"
        || task.type === "milestone"
      ) {
        return;
      }

      handleMoveTaskInside(task, item);
    },

    canDrop: (item: TaskOrEmpty) => item.id !== id
      || (item.comparisonLevel || 1) !== comparisonLevel,

    collect: (monitor) => ({
      isLighten: monitor.canDrop() && monitor.isOver(),
    }),
  }, [id, comparisonLevel, handleMoveTaskInside, task]);

  const [dropAfterProps, dropAfter] = useDrop({
    accept: ROW_DRAG_TYPE,
    
    drop: (item: TaskOrEmpty) => {
      handleMoveTaskAfter(task, item);
    },

    collect: (monitor) => ({
      isLighten: monitor.isOver(),
    }),
  }, [id, comparisonLevel, handleMoveTaskAfter, task]);

  const dependencies = useMemo<Task[]>(() => {
    const dependenciesAtLevel = dependencyMap.get(comparisonLevel);

    if (!dependenciesAtLevel) {
      return [];
    }

    const dependenciesByTask = dependenciesAtLevel.get(id);

    if (!dependenciesByTask) {
      return [];
    }

    return dependenciesByTask.map(({ source }) => source);
  }, [comparisonLevel, dependencyMap, id]);

  const columnData: ColumnData = useMemo(() => ({
    canMoveTasks,
    dateSetup,
    dependencies,
    depth,
    distances,
    handleDeteleTask,
    handleAddTask,
    handleEditTask,
    hasChildren,
    icons,
    indexStr,
    isClosed,
    isShowTaskNumbers,
    onExpanderClick,
    task: task.type === 'empty' ? task : getTaskCurrentState(task),
  }), [
    canMoveTasks,
    dateSetup,
    dependencies,
    depth,
    distances,
    getTaskCurrentState,
    handleDeteleTask,
    handleAddTask,
    handleEditTask,
    hasChildren,
    icons,
    indexStr,
    isClosed,
    isShowTaskNumbers,
    onExpanderClick,
    task,
  ]);

  return (
    <div
      className={cx(styles.taskListTableRow, {
        [styles.lighten]: dropInsideProps.isLighten && !dropAfterProps.isLighten,
      })}
      onClick={onRootClick}
      style={{
        height: fullRowHeight,
        backgroundColor: isSelected
          ? colors.selectedTaskBackgroundColor
          : isEven
            ? colors.evenTaskBackgroundColor
            : undefined,
        ...style,
      }}
      ref={dropInside}
    >
      {columns.map(({
        component: Component,
        width,
      }, index) => {
        const columnWidth = columnResizeEvent && columnResizeEvent.columnIndex === index
          ? Math.max(5, width + columnResizeEvent.endX - columnResizeEvent.startX)
          : width;

        return (
          <div
            className={styles.taskListCell}
            style={{
              minWidth: columnWidth,
              maxWidth: columnWidth,
            }}
            key={index}
          >
            <Component
              data={columnData}
            />
          </div>
        );
      })}

      {dropInsideProps.isLighten && (
        <div
          className={cx(styles.dropAfter, {
            [styles.dropAfterLighten]: dropAfterProps.isLighten,
          })}
          ref={dropAfter}
        />
      )}
    </div>
  );
};

export const TaskListTableRow = memo(TaskListTableRowInner);
