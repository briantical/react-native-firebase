/**
 * 
 * Messaging (FCM) representation wrapper
 */
import { Platform } from 'react-native';
import { SharedEventEmitter } from '../../utils/events';
import INTERNALS from '../../utils/internals';
import { getLogger } from '../../utils/log';
import ModuleBase from '../../utils/ModuleBase';
import { getNativeModule } from '../../utils/native';
import { isFunction, isObject } from '../../utils';
import IOSMessaging from './IOSMessaging';
import RemoteMessage from './RemoteMessage';
const NATIVE_EVENTS = ['messaging_message_received', 'messaging_token_refreshed'];
export const MODULE_NAME = 'RNFirebaseMessaging';
export const NAMESPACE = 'messaging';
export function isUndefined(value) {
  return typeof value === 'undefined';
}
export function isString(value) {
  return typeof value === 'string';
}

/**
 * @class Messaging
 */
export default class Messaging extends ModuleBase {
  constructor(app) {
    super(app, {
      events: NATIVE_EVENTS,
      moduleName: MODULE_NAME,
      hasMultiAppSupport: false,
      hasCustomUrlSupport: false,
      namespace: NAMESPACE
    });
    this._ios = new IOSMessaging(this);
    SharedEventEmitter.addListener(
    // sub to internal native event - this fans out to
    // public event name: onMessage
    'messaging_message_received', message => {
      SharedEventEmitter.emit('onMessage', new RemoteMessage(message));
    });
    SharedEventEmitter.addListener(
    // sub to internal native event - this fans out to
    // public event name: onMessage
    'messaging_token_refreshed', token => {
      SharedEventEmitter.emit('onTokenRefresh', token);
    });

    // Tell the native module that we're ready to receive events
    if (Platform.OS === 'ios') {
      getNativeModule(this).jsInitialised();
    }
  }
  get ios() {
    return this._ios;
  }
  getToken({
    appName,
    senderId
  } = {}) {
    if (!isUndefined(appName) && !isString(appName)) {
      throw new Error("firebase.messaging().getToken(*) 'projectId' expected a string.");
    }
    if (!isUndefined(senderId) && !isString(senderId)) {
      throw new Error("firebase.messaging().getToken(*) 'senderId' expected a string.");
    }
    return getNativeModule(this).getToken(appName || this.app.name, senderId || this.app.options.messagingSenderId);
  }
  deleteToken({
    appName,
    senderId
  } = {}) {
    if (!isUndefined(appName) && !isString(appName)) {
      throw new Error("firebase.messaging().deleteToken(*) 'projectId' expected a string.");
    }
    if (!isUndefined(senderId) && !isString(senderId)) {
      throw new Error("firebase.messaging().deleteToken(*) 'senderId' expected a string.");
    }
    return getNativeModule(this).deleteToken(appName || this.app.name, senderId || this.app.options.messagingSenderId);
  }
  onMessage(nextOrObserver) {
    let listener;
    if (isFunction(nextOrObserver)) {
      // $FlowExpectedError: Not coping with the overloaded method signature
      listener = nextOrObserver;
    } else if (isObject(nextOrObserver) && isFunction(nextOrObserver.next)) {
      listener = nextOrObserver.next;
    } else {
      throw new Error('Messaging.onMessage failed: First argument must be a function or observer object with a `next` function.');
    }
    getLogger(this).info('Creating onMessage listener');
    SharedEventEmitter.addListener('onMessage', listener);
    return () => {
      getLogger(this).info('Removing onMessage listener');
      SharedEventEmitter.removeListener('onMessage', listener);
    };
  }
  onTokenRefresh(nextOrObserver) {
    let listener;
    if (isFunction(nextOrObserver)) {
      // $FlowExpectedError: Not coping with the overloaded method signature
      listener = nextOrObserver;
    } else if (isObject(nextOrObserver) && isFunction(nextOrObserver.next)) {
      listener = nextOrObserver.next;
    } else {
      throw new Error('Messaging.onTokenRefresh failed: First argument must be a function or observer object with a `next` function.');
    }
    getLogger(this).info('Creating onTokenRefresh listener');
    SharedEventEmitter.addListener('onTokenRefresh', listener);
    return () => {
      getLogger(this).info('Removing onTokenRefresh listener');
      SharedEventEmitter.removeListener('onTokenRefresh', listener);
    };
  }
  requestPermission() {
    return getNativeModule(this).requestPermission();
  }

  /**
   * NON WEB-SDK METHODS
   */
  hasPermission() {
    return getNativeModule(this).hasPermission();
  }
  sendMessage(remoteMessage) {
    if (!(remoteMessage instanceof RemoteMessage)) {
      return Promise.reject(new Error(`Messaging:sendMessage expects a 'RemoteMessage' but got type ${typeof remoteMessage}`));
    }
    try {
      return getNativeModule(this).sendMessage(remoteMessage.build());
    } catch (error) {
      return Promise.reject(error);
    }
  }
  subscribeToTopic(topic) {
    return getNativeModule(this).subscribeToTopic(topic);
  }
  unsubscribeFromTopic(topic) {
    return getNativeModule(this).unsubscribeFromTopic(topic);
  }

  /**
   * KNOWN UNSUPPORTED METHODS
   */

  setBackgroundMessageHandler() {
    throw new Error(INTERNALS.STRINGS.ERROR_UNSUPPORTED_MODULE_METHOD('messaging', 'setBackgroundMessageHandler'));
  }
  useServiceWorker() {
    throw new Error(INTERNALS.STRINGS.ERROR_UNSUPPORTED_MODULE_METHOD('messaging', 'useServiceWorker'));
  }
}
export const statics = {
  RemoteMessage
};