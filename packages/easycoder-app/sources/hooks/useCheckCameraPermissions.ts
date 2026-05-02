import { useCameraPermissions } from "expo-camera";
import { Platform } from "react-native";

export function useCheckScannerPermissions(): () => Promise<boolean> {
    const [cameraPermission, requestCameraPermission] = useCameraPermissions();

    return async () => {
        if (Platform.OS === 'android') {
            // adroid uses google code scanner which doesn't need permissions
            return true;
        }

        if (!cameraPermission) {
            // Permission state not loaded yet; request once to avoid silent no-op on first taps.
            try {
                const reqRes = await requestCameraPermission();
                return reqRes.granted;
            } catch (error) {
                console.warn('Failed to request camera permission while loading state:', error);
                return false;
            }
        }

        if (!cameraPermission.granted) {
            const reqRes = await requestCameraPermission();
            return reqRes.granted;
        }

        return true;
    }
}
