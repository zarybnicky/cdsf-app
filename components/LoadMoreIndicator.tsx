import { UseInfiniteQueryResult } from "@tanstack/react-query";
import { Button, ButtonText } from "./ui/button";

export function LoadMoreIndicator({
  infiniteQuery,
}: {
  infiniteQuery: UseInfiniteQueryResult<unknown, unknown>;
}) {
  if (!infiniteQuery.hasNextPage) return null;

  return (
    <Button onPress={infiniteQuery.fetchNextPage}>
      <ButtonText>
        Načíst další
        {infiniteQuery.isFetchingNextPage ? "..." : ""}
      </ButtonText>
    </Button>
  );
}
