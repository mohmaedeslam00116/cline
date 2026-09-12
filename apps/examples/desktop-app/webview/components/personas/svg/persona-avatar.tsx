import type { SpecialistPersonaId } from "@cline/shared/browser";
import type React from "react";
import { AthenaAvatar } from "./athena-avatar";
import { AtlasAvatar } from "./atlas-avatar";
import { CipherAvatar } from "./cipher-avatar";
import { EchoAvatar } from "./echo-avatar";
import { LyraAvatar } from "./lyra-avatar";
import { OrionAvatar } from "./orion-avatar";
import { SentinelAvatar } from "./sentinel-avatar";
import type { PersonaAvatarProps } from "./types";
import { VectorAvatar } from "./vector-avatar";

export interface UnifiedPersonaAvatarProps extends PersonaAvatarProps {
	personaId: SpecialistPersonaId | string;
}

export const PersonaAvatar: React.FC<UnifiedPersonaAvatarProps> = ({
	personaId,
	...props
}) => {
	switch (personaId?.toLowerCase()) {
		case "orion":
			return <OrionAvatar {...props} />;
		case "lyra":
			return <LyraAvatar {...props} />;
		case "athena":
			return <AthenaAvatar {...props} />;
		case "atlas":
			return <AtlasAvatar {...props} />;
		case "cipher":
			return <CipherAvatar {...props} />;
		case "vector":
			return <VectorAvatar {...props} />;
		case "sentinel":
			return <SentinelAvatar {...props} />;
		case "echo":
			return <EchoAvatar {...props} />;
		default:
			return <OrionAvatar {...props} />;
	}
};
