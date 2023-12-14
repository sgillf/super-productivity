import { Directive, HostListener, Input } from '@angular/core';
import { IS_ELECTRON } from '../../../app.constants';
import { BookmarkType } from '../bookmark.model';
import { SnackService } from '../../../core/snack/snack.service';
import { IPC } from '../../../../../electron/shared-with-frontend/ipc-events.const';
import { T } from '../../../t.const';
import { ElectronService } from '../../../core/electron/electron.service';
import { ipcRenderer, shell } from 'electron';
import { electronAPI } from '../../../../../electron/electronAPI';

@Directive({
  selector: '[bookmarkLink]',
})
export class BookmarkLinkDirective {
  @Input() type?: BookmarkType;
  @Input() href?: BookmarkType;

  constructor(
    private _electronService: ElectronService,
    private _snackService: SnackService,
  ) {}

  @HostListener('click', ['$event']) onClick(ev: Event): void {
    if (!this.type || !this.href) {
      return;
    }

    if (ev.target) {
      const el = ev.target as HTMLElement;
      el.blur();
    }
    if (IS_ELECTRON) {
      ev.preventDefault();
      if (!this.type || this.type === 'LINK') {
        this._openExternalUrl(this.href);
      } else if (this.type === 'FILE') {
        window.electronAPI.openPath(this.href);
      } else if (this.type === 'COMMAND') {
        this._snackService.open({
          msg: T.GLOBAL_SNACK.RUNNING_X,
          translateParams: { str: this.href },
          ico: 'laptop_windows',
        });
        this._exec(this.href);
      }
    } else if (this.type === 'LINK') {
      this._openExternalUrl(this.href);
    }
  }

  private _openExternalUrl(rawUrl: string): void {
    // try to account for jira(?) adding a second http to the url
    const url = rawUrl
      .replace('https://https://', 'https://')
      .replace('http://http://', 'http://');

    if (IS_ELECTRON) {
      window.electronAPI.openExternal(url);
    } else {
      const win = window.open(url, '_blank');
      if (win) {
        win.focus();
      }
    }
  }

  private _exec(command: string): void {
    (this._electronService.ipcRenderer as typeof ipcRenderer).send(IPC.EXEC, command);
  }
}
