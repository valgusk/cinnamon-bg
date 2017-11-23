// -*- mode: js; js-indent-level: 2; indent-tabs-mode: nil -*-

const WindowUtils = imports.misc.windowUtils;
const Overview = imports.ui.overview;
const ExpoThumbnail = imports.ui.expoThumbnail;
const Meta = imports.gi.Meta;
const Clutter = imports.gi.Clutter;
const St = imports.gi.St;
const Lang = imports.lang;

let originalAnimate, originalInit, overviewAnimateVisible, expoThumbnailInit;

function DesktopBackgroundClone() {
    this._init.apply(this, arguments);
}

DesktopBackgroundClone.prototype = {
  _init : function(realWindow) {
    this.actor = new Clutter.Group({reactive: true});
    this.actor._delegate = this;
    this.realWindow = realWindow;
    this.metaWindow = realWindow.meta_window;
    this.refreshClone();
    this.actor.connect('destroy', Lang.bind(this, this.onDestroy));
  },

  refreshClone: function(withTransients) {
    if (this.clone) {this.clone.destroy();}
    this.clone = new St.Widget({ reactive: false });
    this.actor.add_actor(this.clone);
    let [pwidth, pheight] = [this.realWindow.width, this.realWindow.height];
    let clones = WindowUtils.createWindowClone(this.metaWindow, pwidth, pheight, withTransients);
    for (let i in clones) {
        let clone = clones[i].actor;
        this.clone.add_actor(clone);
        clone.set_position(0, 0);
    }
  },

  destroy: function () {
    this.actor.destroy();
  },

  onDestroy: function() {
    // this.disconnectAll();
  },
};

function addWindowsToBackground(background){

  try {
    let nonDesktop = null;

    let children = background.get_children();

    for (let i = 0; i < children.length; i++) {
      let childType = children[i].constructor.name;
      if (childType != "Meta_BackgroundActor" && nonDesktop == null){
        nonDesktop = children[i];
      }
    };
    

    let windows = global.get_window_actors();

    // Create clones for windows that should be visible in the Expo
    for (let i = 0; i < windows.length; i++) {
      if(windows[i].meta_window.get_window_type() == Meta.WindowType.DESKTOP){
        if(true || windows[i].meta_window.get_title().match('mpv')){
          let title = windows[i].meta_window.get_title();

          if(title == "Desktop"){

          } else {
            let bg = new DesktopBackgroundClone(windows[i]);
            background.insert_child_below(bg.actor, nonDesktop);
            // background.set_child_below_sibling(bg.actor, nonDesktop);
          }
        }
      }
    }
      
  } catch (e){
    global.logError(e);
  }
}



overviewAnimateVisible = function() {
  let ret = this._oldAnimateVisible();
  if(this._background != null){
    addWindowsToBackground(this._background);
  }
  return ret;
}

expoThumbnailInit = function(metaWorkspace, box) {
  let ret = this._oldIinit(metaWorkspace, box);
  addWindowsToBackground(this.background);
  return ret;
}


function init(){
  originalAnimate = Overview.Overview.prototype._animateVisible;
  originalInit = ExpoThumbnail.ExpoWorkspaceThumbnail.prototype._init;
}

function enable(){
  Overview.Overview.prototype._animateVisible = overviewAnimateVisible;
  Overview.Overview.prototype._oldAnimateVisible = originalAnimate;
  ExpoThumbnail.ExpoWorkspaceThumbnail.prototype._init = expoThumbnailInit;
  ExpoThumbnail.ExpoWorkspaceThumbnail.prototype._oldIinit = originalInit;
}

function disable(){
  delete Overview.Overview.prototype._oldAnimateVisible;
  Overview.Overview.prototype._animateVisible = originalAnimate;

  delete ExpoThumbnail.ExpoWorkspaceThumbnail.prototype._oldIinit;
  ExpoThumbnail.ExpoWorkspaceThumbnail.prototype._init = originalInit;
}