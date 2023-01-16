import React, {
  Fragment,
  useCallback,
} from "react";

import {
  ChangeInProgress,
  ChildMapByLevel,
  ChildOutOfParentWarnings,
  ColorStyles,
  CriticalPaths,
  DependencyMap,
  DependencyMargins,
  DependentMap,
  Distances,
  EventOption,
  FixPosition,
  MapTaskToCoordinates,
  MapTaskToGlobalIndex,
  MapTaskToRowIndex,
  Task,
  TaskMapByLevel,
  TaskOrEmpty,
} from "../../types/public-types";
import { Arrow } from "../other/arrow";
import { RelationLine } from "../other/relation-line";
import { TaskItem } from "../task-item/task-item";
import {
  BarMoveAction,
  GanttRelationEvent,
  RelationMoveTarget,
} from "../../types/gantt-task-actions";
import { getChangeTaskMetadata } from "../../helpers/get-change-task-metadata";
import { getTaskCoordinates as getTaskCoordinatesDefault } from "../../helpers/get-task-coordinates";

export type TaskGanttContentProps = {
  getTaskGlobalIndexByRef: (task: Task) => number;
  taskYOffset: number;
  visibleTasks: readonly TaskOrEmpty[];
  visibleTasksMirror: Readonly<Record<string, true>>;
  childTasksMap: ChildMapByLevel;
  distances: Distances;
  tasksMap: TaskMapByLevel;
  mapTaskToGlobalIndex: MapTaskToGlobalIndex;
  mapTaskToRowIndex: MapTaskToRowIndex;
  mapTaskToCoordinates: MapTaskToCoordinates;
  childOutOfParentWarnings: ChildOutOfParentWarnings;
  dependencyMap: DependencyMap;
  dependentMap: DependentMap;
  dependencyMarginsMap: DependencyMargins;
  isShowDependencyWarnings: boolean;
  cirticalPaths: CriticalPaths;
  ganttRelationEvent: GanttRelationEvent | null;
  selectedTask: Task | null;
  fullRowHeight: number;
  svgWidth: number;
  taskHeight: number;
  taskHalfHeight: number;
  fontSize: string;
  fontFamily: string;
  rtl: boolean;
  changeInProgress: ChangeInProgress | null;
  handleTaskDragStart: (
    action: BarMoveAction,
    task: Task, event: React.MouseEvent<Element, MouseEvent>,
  ) => void;
  setTooltipTask: (task: Task | null) => void;
  handleBarRelationStart: (target: RelationMoveTarget, task: Task) => void;
  setSelectedTask: (task: Task | null) => void;
  handleDeteleTask: (task: TaskOrEmpty) => void;
  onArrowDoubleClick?: (taskFrom: Task, taskTo: Task) => void;
  comparisonLevels: number;
  fixStartPosition?: FixPosition;
  fixEndPosition?: FixPosition;
  colorStyles: ColorStyles;
} & Omit<EventOption, 'onArrowDoubleClick'>;

export const TaskGanttContent: React.FC<TaskGanttContentProps> = ({
  getTaskGlobalIndexByRef,
  svgWidth,
  taskYOffset,
  visibleTasks,
  visibleTasksMirror,
  childTasksMap,
  distances,
  tasksMap,
  mapTaskToGlobalIndex,
  mapTaskToRowIndex,
  mapTaskToCoordinates,
  childOutOfParentWarnings,
  dependencyMap,
  dependentMap,
  dependencyMarginsMap,
  isShowDependencyWarnings,
  cirticalPaths,
  ganttRelationEvent,
  selectedTask,
  fullRowHeight,
  taskHeight,
  taskHalfHeight,
  fontFamily,
  fontSize,
  rtl,
  changeInProgress,
  handleTaskDragStart,
  setTooltipTask,
  handleBarRelationStart,
  setSelectedTask,
  handleDeteleTask,
  onFixDependencyPosition = undefined,
  onDoubleClick,
  onClick,
  onArrowDoubleClick = undefined,
  comparisonLevels,
  fixStartPosition = undefined,
  fixEndPosition = undefined,
  colorStyles,
}) => {
  const handleFixDependency = useCallback((task: Task, delta: number) => {
    if (!onFixDependencyPosition) {
      return;
    }

    const {
      start,
      end,
    } = task;

    const newStart = new Date(start.getTime() + delta);
    const newEnd = new Date(end.getTime() + delta);

    const newChangedTask = {
      ...task,
      start: newStart,
      end: newEnd,
    };

    const [
      dependentTasks,
      taskIndex,
      parents,
      suggestions,
    ] = getChangeTaskMetadata(
      {
        type: "change",
        task: newChangedTask,
      },
      tasksMap,
      childTasksMap,
      mapTaskToGlobalIndex,
      dependentMap,
    );

    onFixDependencyPosition(
      newChangedTask,
      dependentTasks,
      taskIndex,
      parents,
      suggestions,
    );
  }, [
    onFixDependencyPosition,
    tasksMap,
    childTasksMap,
    mapTaskToGlobalIndex,
    dependentMap,
  ]);

  const getTaskCoordinates = useCallback((task: Task) => {
    if (changeInProgress && changeInProgress.task === task) {
      return changeInProgress.coordinates;
    }

    return getTaskCoordinatesDefault(task, mapTaskToCoordinates);;
  }, [mapTaskToCoordinates, changeInProgress]);

  return (
    <g className="content">
      <g
        className="arrows"
        fill={colorStyles.arrowColor}
        stroke={colorStyles.arrowColor}
      >
        {visibleTasks.map(task => {
          const {
            id: taskId,
            comparisonLevel = 1,
          } = task;

          if (task.type === "empty" || comparisonLevel > comparisonLevels) {
            return (
              <Fragment
                key={`${taskId}_${comparisonLevel}`}
              />
            );
          }

          const dependenciesByLevel = dependencyMap.get(comparisonLevel);
          const marginsByLevel = dependencyMarginsMap.get(comparisonLevel);

          if (!dependenciesByLevel) {
            return (
              <Fragment
                key={`${taskId}_${comparisonLevel}`}
              />
            );
          }

          const dependenciesByTask = dependenciesByLevel.get(taskId);

          if (!dependenciesByTask) {
            return (
              <Fragment
                key={`${taskId}_${comparisonLevel}`}
              />
            );
          }

          const mapTaskRowIndexByLevel = mapTaskToRowIndex.get(comparisonLevel);

          if (!mapTaskRowIndexByLevel) {
            throw new Error(`Row indexes are not found for level ${comparisonLevel}`);
          }

          const criticalPathOnLevel = cirticalPaths.get(comparisonLevel);

          const criticalPathForTask = criticalPathOnLevel
            ? criticalPathOnLevel.dependencies.get(task.id)
            : undefined;

          const {
            x1: toX1,
            x2: toX2,
            y: toY,
          } = getTaskCoordinates(task);

          return dependenciesByTask
            .filter(({ source }) => visibleTasksMirror[source.id])
            .map(({
              ownTarget,
              source,
              sourceTarget,
            }) => {
              const isCritical = criticalPathForTask
                ? criticalPathForTask.has(source.id)
                : false;

              const {
                x1: fromX1,
                x2: fromX2,
                y: fromY,
              } = getTaskCoordinates(source);

              return (
                <Arrow
                  key={`Arrow from ${taskId} to ${source.id} on ${comparisonLevel}`}
                  colorStyles={colorStyles}
                  distances={distances}
                  taskFrom={source}
                  targetFrom={sourceTarget}
                  fromX1={fromX1}
                  fromX2={fromX2}
                  fromY={fromY}
                  taskTo={task}
                  targetTo={ownTarget}
                  toX1={toX1}
                  toX2={toX2}
                  toY={toY}
                  marginsByTask={marginsByLevel ? marginsByLevel.get(task.id) : undefined}
                  mapTaskRowIndexByLevel={mapTaskRowIndexByLevel}
                  fullRowHeight={fullRowHeight}
                  taskHeight={taskHeight}
                  isShowDependencyWarnings={isShowDependencyWarnings}
                  isCritical={isCritical}
                  rtl={rtl}
                  onArrowDoubleClick={onArrowDoubleClick}
                  handleFixDependency={handleFixDependency}
                />
              );
          });
        })}
      </g>

      <g className="bar" fontFamily={fontFamily} fontSize={fontSize}>
        {visibleTasks.map(task => {
          const {
            comparisonLevel = 1,
          } = task;

          const key = `${comparisonLevel}_${task.id}`;

          if (task.type === "empty" || comparisonLevel > comparisonLevels) {
            return (
              <Fragment
                key={key}
              />
            );
          }

          const criticalPathOnLevel = cirticalPaths.get(comparisonLevel);

          const isCritical = criticalPathOnLevel
            ? criticalPathOnLevel.tasks.has(task.id)
            : false;

          const {
            x1,
            x2,
            levelY,
            progressWidth,
            progressX,
          } = getTaskCoordinates(task);

          return (
            <svg
              x={0}
              y={levelY}
              width={svgWidth}
              height={fullRowHeight}
              key={key}
            >
              <TaskItem
                getTaskGlobalIndexByRef={getTaskGlobalIndexByRef}
                progressWidth={progressWidth}
                progressX={progressX}
                task={task}
                taskYOffset={taskYOffset}
                x1={x1}
                x2={x2}
                childTasksMap={childTasksMap}
                childOutOfParentWarnings={childOutOfParentWarnings}
                dependencyMarginsMap={dependencyMarginsMap}
                distances={distances}
                isShowDependencyWarnings={isShowDependencyWarnings}
                taskHeight={taskHeight}
                taskHalfHeight={taskHalfHeight}
                isRelationDrawMode={Boolean(ganttRelationEvent)}
                isProgressChangeable={!task.isDisabled}
                isDateChangeable={!task.isDisabled}
                isRelationChangeable={!task.isDisabled}
                isDelete={!task.isDisabled}
                onDoubleClick={onDoubleClick}
                onClick={onClick}
                onEventStart={handleTaskDragStart}
                setTooltipTask={setTooltipTask}
                onRelationStart={handleBarRelationStart}
                setSelectedTask={setSelectedTask}
                isSelected={selectedTask === task}
                isCritical={isCritical}
                rtl={rtl}
                fixStartPosition={fixStartPosition}
                fixEndPosition={fixEndPosition}
                handleDeteleTask={handleDeteleTask}
                colorStyles={colorStyles}
              />
            </svg>
          );
        })}
      </g>

      {ganttRelationEvent && (
        <RelationLine
          x1={ganttRelationEvent.startX}
          x2={ganttRelationEvent.endX}
          y1={ganttRelationEvent.startY}
          y2={ganttRelationEvent.endY}
        />
      )}
    </g>
  );
};
