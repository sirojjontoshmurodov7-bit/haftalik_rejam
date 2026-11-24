import { registerRootComponent } from 'expo';
import notifee from '@notifee/react-native';
import App from './App';
import { onEvent } from './src/notify';

// Ilova yopiq bo'lganda ham bildirishnoma tugmalari ishlashi uchun
notifee.onBackgroundEvent(onEvent);

registerRootComponent(App);
