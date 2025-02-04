import { components } from "@/CDSF";
import { Text } from "./ui/text";
import { Box } from "./ui/box";
import { Heading } from "./ui/heading";

export function EventRegistration({
  item,
}: {
  item: components["schemas"]["EventRegistration"];
}) {
  return (
    <Box className="bg-background-0 my-1 p-2" key={item.eventId}>
      <Text>{item.date}</Text>
      <Text>{item.city}</Text>
      <Heading>{item.eventName}</Heading>
      {item.competitions.map((c) => (
        <Box key={c.compId}>
          <Text>
            {c.age} {c.discipline} {c.registrationEnd}
          </Text>
          <Text>
            {c.ranking}
            {c.rankingTo ? `-${c.rankingTo}` : ""}
          </Text>
        </Box>
      ))}
    </Box>
  );
}
