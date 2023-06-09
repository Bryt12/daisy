import { collectDataTemplate } from "../templates/collectData.ts";
import { findObjectivesTemplate } from "../templates/findObjectives.ts";
import { Petal } from "../types/petal.ts";
import { SystemChatMessage } from "../util/deps.ts";

/**
 * Checks if a token is punctuation.
 *
 * @param token {string} The token from the model to check.
 * @returns {boolean} Whether the token is punctuation or not.
 */
export const isPunctuation = (token: string): boolean => {
  return token === "." || token === "!" || token === "?" || token === ",";
};

/**
 * Checks if number is less than 3 digits.
 *
 * @param token {string} Token from model.
 * @returns {boolean} Whether the number is less than 3 digits or not.
 */
export const isPositiveIntLessThan1000 = (token: string): boolean => {
  if (token === "" || token === " " || token === "\n") return false;
  try {
    return Number(token) < 1000 && Number(token) >= 0;
  } catch (_e) {
    return false;
  }
};

/**
 * Handles the stream of tokens from the model.
 *
 * The function takes the partial response generated by the model so far and the
 * next token to be added to this response. Based on the token's value, the function
 * decides how it should be appended to the response.
 *
 * @param partialResponse {string} The response generated by the model so far.
 * @param token {string} The next token to be added to the response.
 * @returns {string} The updated response after the token has been added.
 */
export const handleToken = (partialResponse: string, token: string): string => {
  let text = partialResponse;
  const lastChar = text[text.length - 1];

  if (token === "\n") { // Don't want space before new line
    text += "\n";
  } else if (_internals.isPunctuation(token)) { // Don't want space before punctuation
    text += token;
  } else if (
    _internals.isPositiveIntLessThan1000(token) &&
    (_internals.isPositiveIntLessThan1000(lastChar) || lastChar === ",")
  ) {
    // Each token is three numbers, so the number 999999 would be
    // represented as "999 999". This checks if the last token
    // was a number and if the current token is a number, and if
    // so, it doesn't add a space. Also checks if the last token
    // was a comma, because then it could be expressing a large
    // number.
    text += token;
  } else if (token === "") { // End character, end of reponse
    return text;
  } else { // Normal token
    // TODO: If a word is more than one token long there will be
    //       a space in the middle of the word.
    text += " " + token;
  }

  return text;
};

/**
 * Creates a system message that retreives data from user message.
 *
 * This function checks the petal to see if there are any missing objectives in the
 * current task. If there are, it creates a system message that details the information
 * that is needed from the user.
 *
 * @param petal {Petal} The petal to check for data.
 * @param message {string} The message to check for data.
 *
 * @returns {boolean} Whether the user provided data or not.
 */
export const generateCheckForDataMessage = async (
  petal: Petal,
): Promise<SystemChatMessage | void> => {
  const objectives = petal.getCurrentTask()?.getRequiredObjectives();

  if (!objectives) {
    console.log("No objectives found, can't check for data");
  }

  const prompt = findObjectivesTemplate();

  const text = await prompt.format({
    list: objectives,
  });

  return new SystemChatMessage(text);
};

/**
 * Creates a system message that details the information that is needed from the user.
 *
 * This function checks the petal to see if there are any missing objectives in the
 * current task. If there are, it creates a system message that details the information
 * that is needed from the user.
 *
 * @param petal {Petal} The petal to check for missing objectives.
 * @returns {Promise<SystemChatMessage | void>} The system message that details the information
 */
export const generateObjectivesMessage = async (
  petal: Petal,
): Promise<SystemChatMessage | void> => {
  console.log(
    `Checking if petal ${petal.getName()} has any missing objectives`,
  );
  if (!petal) return;

  const currentTask = petal.getCurrentTask();
  if (!currentTask) {
    console.log(
      `Petal has no current task, the petal will be removed from Redis`,
    );
    return;
  }

  const prompt = collectDataTemplate();
  const objectives = currentTask.getRequiredObjectives();
  if (!objectives) return;

  const text = await prompt.format({
    botName: petal.getName(),
    goal: currentTask.getGoal(),
    objectives,
  });

  return new SystemChatMessage(text);
};

// Used to mock functions in tests
export const _internals = { isPunctuation, isPositiveIntLessThan1000 };
