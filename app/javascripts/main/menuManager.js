import { StoreKeys } from './store';
import { AppPaths } from './paths';
const { app, Menu, dialog, shell } = require('electron');

/** TODO(baptiste): precompute `process.platform` at compile-time */
const isMac = process.platform === 'darwin';

export function createMenuManager({
  window,
  archiveManager,
  updateManager,
  trayManager,
  store,
  spellcheckerManager
}) {
  let menu = null;

  function reload() {
    loadMenu();
  }

  function loadMenu() {
    menu = Menu.buildFromTemplate([
      ...(isMac ? [macAppMenu(app.getName())] : []),
      editMenu(spellcheckerManager, reload),
      viewMenu(window, store),
      windowMenu(store, trayManager, reload),
      backupsMenu(archiveManager, reload),
      updateMenu(updateManager),
      helpMenu(window, shell)
    ]);
    Menu.setApplicationMenu(menu);
  }

  return {
    loadMenu,
    reload,
    popupMenu({ x, y }) {
      if (menu) {
        menu.popup(window, x, y);
      }
    }
  };
}

const Roles = {
  Undo: 'undo',
  Redo: 'redo',
  Cut: 'cut',
  Copy: 'copy',
  Paste: 'paste',
  PasteAndMatchStyle: 'pasteandmatchstyle',
  SelectAll: 'selectall',
  Reload: 'reload',
  ToggleDevTools: 'toggledevtools',
  ResetZoom: 'resetzoom',
  ZoomIn: 'zoomin',
  ZoomOut: 'zoomout',
  ToggleFullScreen: 'togglefullscreen',
  Window: 'window',
  Minimize: 'minimize',
  Close: 'close',
  Help: 'help',
  About: 'about',
  Services: 'services',
  Hide: 'hide',
  HideOthers: 'hideothers',
  UnHide: 'unhide',
  Quit: 'quit',
  StartSeeking: 'startspeaking',
  StopSeeking: 'stopspeaking',
  Zoom: 'zoom',
  Front: 'front'
};

const KeyCombinations = {
  CmdOrCtrlW: 'CmdOrCtrl + W',
  CmdOrCtrlM: 'CmdOrCtrl + M',
  AltM: 'Alt + m'
};

const Labels = {
  Edit: 'Edit',
  View: 'View',
  HideMenuBar: 'Hide Menu Bar',
  UseThemedMenuBar: 'Use Themed Menu Bar',
  MinimizeToTrayOnClose: 'Minimize To Tray On Close',
  Backups: 'Backups',
  AutomaticUpdatesEnabled: 'Automatic Updates Enabled',
  AutomaticUpdatesDisabled: 'Automatic Updates Disabled',
  DisableAutomaticBackups: 'Disable Automatic Backups',
  EnableAutomaticBackups: 'Enable Automatic Backups',
  ChangeBackupsLocation: 'Change Backups Location',
  OpenBackupsLocation: 'Open Backups Location',
  EmailSupport: 'Email Support',
  Website: 'Website',
  GitHub: 'GitHub',
  Slack: 'Slack',
  Twitter: 'Twitter',
  ToggleErrorConsole: 'Toggle Error Console',
  OpenDataDirectory: 'Open Data Directory',
  ClearCacheAndReload: 'Clear Cache and Reload',
  Speech: 'Speech',
  Close: 'Close',
  Minimize: 'Minimize',
  Zoom: 'Zoom',
  BringAllToFront: 'Bring All to Front',
  CheckForUpdate: 'Check for Update',
  CheckingForUpdate: 'Checking for update…',
  UpdateAvailable: '(1) Update Available',
  Updates: 'Updates',
  ErrorRetrieving: 'Error Retrieving',
  OpenDownloadLocation: 'Open Download Location',
  DownloadingUpdate: 'Downloading Update…',
  ManuallyDownloadUpdate: 'Manually Download Update',
  SpellcheckerLanguages: 'Spellchecker Languages',
  installPendingUpdate(versionNumber) {
    return `Install Pending Update (${versionNumber})`;
  },
  lastUpdateCheck(date) {
    return `Last checked ${date.toLocaleString()}`;
  },
  version(number) {
    return `Version: ${number}`;
  },
  yourVersion(number) {
    return `Your Version: ${number}`;
  },
  latestVersion(number) {
    return `Latest Version: ${number}`;
  },
  viewReleaseNotes(versionNumber) {
    return `View ${versionNumber} Release Notes`;
  }
};

const MessageBoxTitles = {
  PreferenceChanged: 'Preference Changed'
};
const MessageBoxMessages = {
  MenuBarPreferenceSaved:
    'Your menu bar preference has been saved. ' +
    'Please restart the application for the change to take effect.'
};

const MenuItemTypes = {
  CheckBox: 'checkbox',
  Radio: 'radio'
};

const Separator = {
  type: 'separator'
};

const Urls = {
  Support: 'mailto:help@standardnotes.org',
  Website: 'https://standardnotes.org',
  GitHub: 'https://github.com/standardnotes',
  Slack: 'https://standardnotes.org/slack',
  Twitter: 'https://twitter.com/StandardNotes',
  GitHubReleases: 'https://github.com/standardnotes/desktop/releases'
};

function macAppMenu(appName) {
  return {
    label: appName,
    submenu: [
      {
        role: Roles.About
      },
      Separator,
      {
        role: Roles.Services,
        submenu: []
      },
      Separator,
      {
        role: Roles.Hide
      },
      {
        role: Roles.HideOthers
      },
      {
        role: Roles.UnHide
      },
      Separator,
      {
        role: Roles.Quit
      }
    ]
  };
}

function editMenu(spellcheckerManager, reload) {
  return {
    label: Labels.Edit,
    submenu: [
      {
        role: Roles.Undo
      },
      {
        role: Roles.Redo
      },
      Separator,
      {
        role: Roles.Cut
      },
      {
        role: Roles.Copy
      },
      {
        role: Roles.Paste
      },
      {
        role: Roles.PasteAndMatchStyle
      },
      {
        role: Roles.SelectAll
      },
      ...(isMac
        ? [Separator, macSpeechMenu()]
        : [spellcheckerMenu(spellcheckerManager, reload)])
    ]
  };
}

function macSpeechMenu() {
  return {
    label: Labels.Speech,
    submenu: [
      {
        role: Roles.StartSeeking
      },
      {
        role: Roles.StopSeeking
      }
    ]
  };
}

function spellcheckerMenu(spellcheckerManager, reload) {
  return {
    label: Labels.SpellcheckerLanguages,
    submenu: spellcheckerManager.languages().map(({ name, code, enabled }) => {
      return {
        label: name,
        type: MenuItemTypes.CheckBox,
        checked: enabled,
        click: () => {
          if (enabled) {
            spellcheckerManager.removeLanguage(code);
          } else {
            spellcheckerManager.addLanguage(code);
          }
          reload();
        }
      };
    })
  };
}

function viewMenu(window, store, reload) {
  return {
    label: Labels.View,
    submenu: [
      {
        role: Roles.Reload
      },
      {
        role: Roles.ToggleDevTools
      },
      Separator,
      {
        role: Roles.ResetZoom
      },
      {
        role: Roles.ZoomIn
      },
      {
        role: Roles.ZoomOut
      },
      Separator,
      {
        role: Roles.ToggleFullScreen
      },
      ...(isMac ? [] : [Separator, ...menuBarOptions(window, store, reload)])
    ]
  };
}

function menuBarOptions(window, store, reload) {
  const useSystemMenuBar = store.get(StoreKeys.UseSystemMenuBar);
  let isMenuBarVisible = store.get(StoreKeys.MenuBarVisible);
  window.setMenuBarVisibility(isMenuBarVisible);
  return [
    {
      visible: !isMac && useSystemMenuBar,
      label: Labels.HideMenuBar,
      accelerator: KeyCombinations.AltM,
      click: () => {
        isMenuBarVisible = !isMenuBarVisible;
        window.setMenuBarVisibility(isMenuBarVisible);
        store.set(StoreKeys.MenuBarVisible, isMenuBarVisible);
      }
    },
    {
      label: Labels.UseThemedMenuBar,
      type: MenuItemTypes.CheckBox,
      checked: !useSystemMenuBar,
      click: () => {
        store.set(StoreKeys.UseSystemMenuBar, !useSystemMenuBar);
        reload();
        dialog.showMessageBox({
          title: MessageBoxTitles.PreferenceChanged,
          message: MessageBoxMessages.MenuBarPreferenceSaved
        });
      }
    }
  ];
}

function windowMenu(store, trayManager, reload) {
  return {
    role: Roles.Window,
    submenu: [
      {
        role: Roles.Minimize
      },
      {
        role: Roles.Close
      },
      Separator,
      ...(isMac
        ? macWindowItems()
        : [minimizeToTrayItem(store, trayManager, reload)])
    ]
  };
}

function macWindowItems() {
  return [
    {
      label: Labels.Close,
      accelerator: KeyCombinations.CmdOrCtrlW,
      role: Roles.Close
    },
    {
      label: Labels.Minimize,
      accelerator: Labels.CmdOrCtrlM,
      role: Roles.Minimize
    },
    {
      label: Labels.Zoom,
      role: Roles.Zoom
    },
    Separator,
    {
      label: Labels.BringAllToFront,
      role: Roles.Front
    }
  ];
}

function minimizeToTrayItem(store, trayManager, reload) {
  const minimizeToTray = trayManager.shouldMinimizeToTray();
  return {
    label: Labels.MinimizeToTrayOnClose,
    type: MenuItemTypes.CheckBox,
    checked: minimizeToTray,
    click() {
      store.set(StoreKeys.MinimizeToTray, !minimizeToTray);
      if (trayManager.shouldMinimizeToTray()) {
        trayManager.createTrayIcon();
      } else {
        trayManager.destroyTrayIcon();
      }
      reload();
    }
  };
}

function backupsMenu(archiveManager, reload) {
  return {
    label: Labels.Backups,
    submenu: [
      {
        label: archiveManager.isBackupsEnabled()
          ? Labels.DisableAutomaticBackups
          : Labels.EnableAutomaticBackups,
        click() {
          archiveManager.toggleBackupsStatus();
          reload();
        }
      },
      Separator,
      {
        label: Labels.ChangeBackupsLocation,
        click() {
          archiveManager.changeBackupsLocation();
        }
      },
      {
        label: Labels.OpenBackupsLocation,
        click() {
          shell.openItem(archiveManager.getBackupsLocation());
        }
      }
    ]
  };
}

function updateMenu(updateManager) {
  const updateData = updateManager.getMetadata();
  const updateNeeded = updateManager.updateNeeded();
  let label;
  if (updateData.checkingForUpdate) {
    label = Labels.CheckingForUpdate;
  } else if (updateNeeded) {
    label = Labels.UpdateAvailable;
  } else {
    label = Labels.Updates;
  }
  const submenu = [];
  const structure = { label, submenu };

  if (updateManager.autoupdateDownloaded()) {
    submenu.push({
      label: Labels.installPendingUpdate(
        updateManager.autoupdateDownloadedVersion()
      ),
      click() {
        updateManager.installAutoupdateNow();
      }
    });
  }

  submenu.push({
    label: updateManager.autoupdateEnabled()
      ? Labels.AutomaticUpdatesEnabled
      : Labels.AutomaticUpdatesDisabled,
    click() {
      updateManager.toggleAutoupdateStatus();
    }
  });

  submenu.push(Separator);

  if (updateData.lastCheck && !updateData.checkinForUpdate) {
    submenu.push({
      label: Labels.lastUpdateCheck(updateData.lastCheck),
      click: () => {}
    });
  }

  if (!updateData.checkinForUpdate) {
    submenu.push({
      label: Labels.CheckForUpdate,
      click: () => {
        updateManager.checkForUpdate({ userTriggered: true });
      }
    });
  }

  submenu.push(Separator);

  submenu.push({
    label: Labels.yourVersion(updateData.currentVersion),
    click: () => {}
  });

  const latestVersion = updateManager.latestVersion();
  submenu.push({
    label: latestVersion
      ? Labels.latestVersion(latestVersion)
      : Labels.ErrorRetrieving,
    click() {
      updateManager.openChangelog();
    }
  });

  submenu.push(Separator);

  submenu.push({
    label: Labels.viewReleaseNotes(latestVersion),
    click() {
      updateManager.openChangelog();
    }
  });

  if (updateData.latestDownloaded) {
    submenu.push({
      label: Labels.OpenDownloadLocation,
      click() {
        updateManager.openDownloadLocation();
      }
    });
  } else if (updateNeeded || updateData.downloadingUpdate) {
    submenu.push({
      label: updateData.downloadingUpdate
        ? Labels.DownloadingUpdate
        : Labels.ManuallyDownloadUpdate,
      click() {
        updateData.downloadingUpdate
          ? updateManager.openDownloadLocation()
          : updateManager.downloadUpdateFile();
      }
    });
  }

  return structure;
}

function helpMenu(window, shell) {
  return {
    role: Roles.Help,
    submenu: [
      {
        label: Labels.EmailSupport,
        click() {
          shell.openExternal(Urls.Support);
        }
      },
      {
        label: Labels.Website,
        click() {
          shell.openExternal(Urls.Website);
        }
      },
      {
        label: Labels.GitHub,
        click() {
          shell.openExternal(Urls.GitHub);
        }
      },
      {
        label: Labels.Slack,
        click() {
          shell.openExternal(Urls.Slack);
        }
      },
      {
        label: Labels.Twitter,
        click() {
          shell.openExternal(Urls.Twitter);
        }
      },
      Separator,
      {
        label: Labels.ToggleErrorConsole,
        click() {
          window.webContents.toggleDevTools();
        }
      },
      {
        label: Labels.OpenDataDirectory,
        click() {
          const userDataPath = app.getPath(AppPaths.UserData);
          shell.openItem(userDataPath);
        }
      },
      {
        label: Labels.ClearCacheAndReload,
        click() {
          window.webContents.session.clearCache(() => {
            window.reload();
          });
        }
      },
      Separator,
      {
        label: Labels.version(app.getVersion()),
        click() {
          shell.openExternal(Urls.GitHubReleases);
        }
      }
    ]
  };
}
