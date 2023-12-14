import { Inject, Injectable } from '@angular/core';
import { loadFromRealLs, saveToRealLs } from '../../core/persistence/local-storage';
import { LS } from '../../core/persistence/storage-keys.const';
import { DOCUMENT } from '@angular/common';
import { LocalUiHelperSettings } from './ui-helper.model';
import { UI_LOCAL_HELPER_DEFAULT } from './ui-helper.const';
import { ElectronService } from '../../core/electron/electron.service';
import { IPC } from '../../../../electron/shared-with-frontend/ipc-events.const';
import { IS_ELECTRON } from '../../app.constants';
import { fromEvent } from 'rxjs';
import { throttleTime } from 'rxjs/operators';
import { ipcRenderer } from 'electron';

@Injectable({ providedIn: 'root' })
export class UiHelperService {
  constructor(
    @Inject(DOCUMENT) private _document: Document,
    private _electronService: ElectronService,
  ) {}

  initElectron(): void {
    this._initMousewheelZoomForElectron();
  }

  zoomTo(zoomFactor: number): void {
    if (Number.isNaN(zoomFactor)) {
      console.error('Invalid zoom factor', zoomFactor);
      return;
    }

    window.electronAPI.setZoomFactor(zoomFactor);
    this._updateLocalUiHelperSettings({ zoomFactor });
  }

  zoomBy(zoomBy: number): void {
    if (Number.isNaN(zoomBy)) {
      console.error('Invalid zoom factor', zoomBy);
      return;
    }
    const currentZoom = window.electronAPI.getZoomFactor();
    console.log({ currentZoom });

    const zoomFactor = currentZoom + zoomBy;

    window.electronAPI.setZoomFactor(zoomFactor);
    this._updateLocalUiHelperSettings({ zoomFactor });
  }

  focusApp(): void {
    if (IS_ELECTRON) {
      //  otherwise the last focused task get's focused again leading to unintended keyboard events
      if (document.activeElement) {
        (document.activeElement as HTMLElement).blur();
      }

      (this._electronService.ipcRenderer as typeof ipcRenderer).send(IPC.SHOW_OR_FOCUS);
    } else {
      console.error('Cannot execute focus app window in browser');
    }
  }

  private _initMousewheelZoomForElectron(): void {
    const ZOOM_DELTA = 0.025;

    // set initial zoom
    this.zoomTo(this._getLocalUiHelperSettings().zoomFactor);

    fromEvent(this._document, 'mousewheel')
      .pipe(throttleTime(20))
      .subscribe((event: any) => {
        if (event && event.ctrlKey) {
          // this does not prevent scrolling unfortunately
          // event.preventDefault();

          let zoomFactor = window.electronAPI.getZoomFactor();
          if (event.deltaY > 0) {
            zoomFactor -= ZOOM_DELTA;
          } else if (event.deltaY < 0) {
            zoomFactor += ZOOM_DELTA;
          }
          zoomFactor = Math.min(Math.max(zoomFactor, 0.1), 4);
          this.zoomTo(zoomFactor);
        }
      });
  }

  private _getLocalUiHelperSettings(): LocalUiHelperSettings {
    return (
      (loadFromRealLs(LS.LOCAL_UI_HELPER) as LocalUiHelperSettings) ||
      UI_LOCAL_HELPER_DEFAULT
    );
  }

  private _updateLocalUiHelperSettings(newCfg: Partial<LocalUiHelperSettings>): void {
    saveToRealLs(LS.LOCAL_UI_HELPER, {
      ...this._getLocalUiHelperSettings(),
      ...newCfg,
    });
  }
}
