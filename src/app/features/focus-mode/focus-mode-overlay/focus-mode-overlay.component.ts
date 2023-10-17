import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { TaskService } from '../../tasks/task.service';
import { Subject } from 'rxjs';
import { first, takeUntil } from 'rxjs/operators';
import { GlobalConfigService } from '../../config/global-config.service';
import { Router } from '@angular/router';
import { expandAnimation } from '../../../ui/animations/expand.ani';
import { FocusModePage } from '../focus-mode.const';
import { Store } from '@ngrx/store';
import {
  selectFocusSessionActivePage,
  selectFocusSessionDuration,
  selectFocusSessionProgress,
  selectFocusSessionTimeToGo,
} from '../store/focus-mode.selectors';
import {
  hideFocusOverlay,
  setFocusSessionActivePage,
  setFocusSessionDuration,
  startFocusSession,
} from '../store/focus-mode.actions';
import { updateTask } from '../../tasks/store/task.actions';

@Component({
  selector: 'focus-mode-overlay',
  templateUrl: './focus-mode-overlay.component.html',
  styleUrls: ['./focus-mode-overlay.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [expandAnimation],
})
export class FocusModeOverlayComponent implements OnDestroy {
  FocusModePage: typeof FocusModePage = FocusModePage;

  activePage$ = this._store.select(selectFocusSessionActivePage);
  timeToGo$ = this._store.select(selectFocusSessionTimeToGo);
  sessionDuration$ = this._store.select(selectFocusSessionDuration);
  sessionProgress$ = this._store.select(selectFocusSessionProgress);

  private _onDestroy$ = new Subject<void>();

  constructor(
    public readonly taskService: TaskService,
    private readonly _globalConfigService: GlobalConfigService,
    private readonly _store: Store,
    private readonly _router: Router,
  ) {
    // TODO this needs to work differently
    this.taskService.currentTask$
      .pipe(first(), takeUntil(this._onDestroy$))
      .subscribe((task) => {
        if (!task) {
          // this.taskService.startFirstStartable();
          // this.activePage = FocusModePage.Main;
          this._store.dispatch(
            setFocusSessionActivePage({ focusActivePage: FocusModePage.TaskSelection }),
          );
        } else {
          this._store.dispatch(
            setFocusSessionActivePage({
              focusActivePage: FocusModePage.DurationSelection,
            }),
          );
        }
      });

    this.activePage$.subscribe((v) => console.log(`activePage$`, v));
  }

  ngOnDestroy(): void {
    this._onDestroy$.next();
    this._onDestroy$.complete();
  }

  onTaskDone(taskId: string): void {
    // TODO better define
    this._store.dispatch(
      setFocusSessionActivePage({ focusActivePage: FocusModePage.TaskDone }),
    );
    this._store.dispatch(
      updateTask({
        task: {
          id: taskId,
          changes: {
            isDone: true,
          },
        },
      }),
    );
  }

  onTaskSelected(task: Task | string): void {
    console.log({ task });

    if (typeof task === 'string') {
      // TODO create task
    } else {
      this._store.dispatch(
        setFocusSessionActivePage({ focusActivePage: FocusModePage.DurationSelection }),
      );
    }
  }

  onFocusModeDurationSelected(focusSessionDuration: number): void {
    this._store.dispatch(setFocusSessionDuration({ focusSessionDuration }));
    this._store.dispatch(startFocusSession());
    this._store.dispatch(
      setFocusSessionActivePage({ focusActivePage: FocusModePage.Main }),
    );
  }

  cancelFocusSession(): void {
    this.taskService.setCurrentId(null);
    this._store.dispatch(hideFocusOverlay());
  }
}