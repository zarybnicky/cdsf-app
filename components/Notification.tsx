import { components } from "@/CDSF";
import { Box } from "@/components/ui/box";
import Markdown from "@ronradtke/react-native-markdown-display";
import { ExternalLink } from "@/components/ExternalLink";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";

export function Notification({
  item,
}: {
  item: components["schemas"]["Notification"];
}) {
  return (
    <Box className="bg-background-0 my-2 p-2" key={item.id}>
      <Heading>
        {item.link ? (
          <ExternalLink href={item.link}>{item.caption}</ExternalLink>
        ) : (
          item.caption
        )}
      </Heading>
      <Text>{[item.author, item.created].filter(Boolean).join(" / ")}</Text>
      {item.message && <Markdown children={item.message} />}
    </Box>
  );
}
