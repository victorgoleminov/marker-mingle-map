import { Loader2, Compass, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface MapControlsProps {
  isSharing: boolean;
  loading: boolean;
  position: [number, number] | null;
  onToggleSharing: () => void;
  onUpdateLocation: () => void;
}

export const MapControls = ({
  isSharing,
  loading,
  position,
  onToggleSharing,
  onUpdateLocation,
}: MapControlsProps) => {
  const copyLocation = () => {
    if (!position) {
      toast.error('No location to copy');
      return;
    }
    const [lat, lng] = position;
    const text = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    navigator.clipboard.writeText(text).then(
      () => toast.success('Location copied to clipboard'),
      () => toast.error('Failed to copy location')
    );
  };

  return (
    <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-[1000]">
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <Switch
            checked={isSharing}
            onCheckedChange={onToggleSharing}
            aria-label="Toggle location sharing"
          />
          <span className="text-sm">
            {isSharing ? 'Sharing location' : 'Location sharing off'}
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <Button
            onClick={onUpdateLocation}
            className="w-full"
            disabled={loading}
            size="sm"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Compass className="h-4 w-4" />
            )}
            <span className="ml-2">Update location</span>
          </Button>
          <Button
            onClick={copyLocation}
            className="w-full"
            disabled={!position}
            variant="outline"
            size="sm"
          >
            <Copy className="h-4 w-4" />
            <span className="ml-2">Copy coordinates</span>
          </Button>
        </div>
      </div>
    </div>
  );
};