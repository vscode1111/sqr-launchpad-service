import { TypedContractEvent, TypedDeferredTopicFilter } from '~typechain-types/common';

export async function getTopic0(
  filter: TypedDeferredTopicFilter<TypedContractEvent>,
): Promise<string> {
  const topics = (await filter?.getTopicFilter()) as any as string[];
  if (topics.length === 0) {
    throw Error("Couldn't find filter for topic 0");
  }
  return topics[0];
}
